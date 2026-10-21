import type { SyncDirection, SyncSignal, SyncSignalCandidate } from '../types';

/**
 * Serverloser Geräte-Sync per WebRTC-DataChannel. Signalisiert wird per QR-Code (oder kopiertem
 * Code): Gerät A zeigt ein Angebot, Gerät B scannt es und zeigt eine Antwort, A scannt diese.
 * Die Verbindung ist Ende-zu-Ende verschlüsselt (DTLS); der Fingerabdruck steckt im QR-Code, den man
 * vor Ort abscannt – ein Dritter kann sich so nicht dazwischenschalten.
 *
 * Der öffentliche STUN-Server hilft nur beim Finden der eigenen Adresse (kein Konto, keine Daten);
 * die Übertragung selbst läuft direkt zwischen den Geräten – am zuverlässigsten im selben WLAN.
 */
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
const ICE_GATHER_TIMEOUT_MS = 3000;
const CONNECT_TIMEOUT_MS = 30_000;
const CHANNEL_LABEL = 'hardcost-sync';

/** Kennung im QR-Code; ändert sich das Format, wird die Nummer erhöht. */
const SIGNAL_PREFIX = 'HC1';

// ─── Kompaktes Signal-Format ────────────────────────────────────────────────
// Statt des ganzen SDP (~650 Zeichen, kaum komprimierbar) nur, was die Gegenseite braucht (~200):
// HC1|o|send|<ufrag>|<pwd>|<fingerprint base64>|<ip,port,typ,priorität;…>

function base64FromHex(hex: string): string {
  const bytes = hex.split(':').map((part) => Number.parseInt(part, 16));
  return btoa(String.fromCharCode(...bytes));
}

function hexFromBase64(value: string): string {
  return [...atob(value)].map((char) => char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join(':');
}

function parseCandidates(sdp: string): SyncSignalCandidate[] {
  return sdp
    .split(/\r?\n/)
    .filter((line) => line.startsWith('a=candidate:'))
    .flatMap((line): SyncSignalCandidate[] => {
      // candidate:<foundation> <component> <protocol> <priority> <ip> <port> typ <type> …
      const [, component, protocol, priority, ip, port, , type] = line.slice('a=candidate:'.length).split(' ');
      if (component !== '1' || protocol?.toLowerCase() !== 'udp' || !ip || !port || !type || !priority) return [];
      return [{ ip, port: Number(port), type, priority: Number(priority) }];
    });
}

function sdpValue(sdp: string, key: string): string | undefined {
  return sdp
    .split(/\r?\n/)
    .find((line) => line.startsWith(`a=${key}:`))
    ?.slice(key.length + 3)
    .trim();
}

export function encodeSignal(signal: SyncSignal): string {
  const candidates = signal.candidates.map((c) => `${c.ip},${c.port},${c.type},${c.priority}`).join(';');
  return [
    SIGNAL_PREFIX,
    signal.kind === 'offer' ? 'o' : 'a',
    signal.direction,
    signal.ufrag,
    signal.pwd,
    base64FromHex(signal.fingerprint),
    candidates,
  ].join('|');
}

export function decodeSignal(text: string): SyncSignal {
  const [prefix, kind, direction, ufrag, pwd, fingerprint, candidates = ''] = text.trim().split('|');
  if (prefix !== SIGNAL_PREFIX || !ufrag || !pwd || !fingerprint) {
    throw new Error('Das ist kein HardCost-Sync-Code.');
  }
  if ((kind !== 'o' && kind !== 'a') || (direction !== 'send' && direction !== 'receive')) {
    throw new Error('Der Sync-Code ist beschädigt.');
  }
  return {
    kind: kind === 'o' ? 'offer' : 'answer',
    direction,
    ufrag,
    pwd,
    fingerprint: hexFromBase64(fingerprint),
    candidates: candidates
      .split(';')
      .filter(Boolean)
      .flatMap((entry): SyncSignalCandidate[] => {
        const [ip, port, type, priority] = entry.split(',');
        return ip && port && type && priority ? [{ ip, port: Number(port), type, priority: Number(priority) }] : [];
      }),
  };
}

function signalFromDescription(description: RTCSessionDescription, direction: SyncDirection): SyncSignal {
  const { sdp } = description;
  const ufrag = sdpValue(sdp, 'ice-ufrag');
  const pwd = sdpValue(sdp, 'ice-pwd');
  const fingerprint = sdpValue(sdp, 'fingerprint')?.split(' ');
  if (!ufrag || !pwd || fingerprint?.[0]?.toLowerCase() !== 'sha-256' || !fingerprint[1]) {
    throw new Error('Dieser Browser liefert keine passende Verbindung (WebRTC).');
  }
  return {
    kind: description.type === 'offer' ? 'offer' : 'answer',
    direction,
    ufrag,
    pwd,
    fingerprint: fingerprint[1],
    candidates: parseCandidates(sdp),
  };
}

/** Baut aus dem kompakten Signal ein vollständiges SDP für einen reinen DataChannel. */
function descriptionFromSignal(signal: SyncSignal): RTCSessionDescriptionInit {
  const lines = [
    'v=0',
    `o=- ${Date.now()} 2 IN IP4 127.0.0.1`,
    's=-',
    't=0 0',
    'a=group:BUNDLE 0',
    'a=msid-semantic: WMS',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
    'c=IN IP4 0.0.0.0',
    `a=ice-ufrag:${signal.ufrag}`,
    `a=ice-pwd:${signal.pwd}`,
    'a=ice-options:trickle',
    `a=fingerprint:sha-256 ${signal.fingerprint}`,
    // Angebot lässt die Rolle offen, die Antwort übernimmt den aktiven DTLS-Part.
    `a=setup:${signal.kind === 'offer' ? 'actpass' : 'active'}`,
    'a=mid:0',
    'a=sctp-port:5000',
    'a=max-message-size:262144',
    ...signal.candidates.map(
      (c, index) =>
        `a=candidate:${index + 1} 1 udp ${c.priority} ${c.ip} ${c.port} typ ${c.type}` +
        (c.type === 'host' ? '' : ' raddr 0.0.0.0 rport 0'),
    ),
    'a=end-of-candidates',
    '',
  ];
  return { type: signal.kind, sdp: lines.join('\r\n') };
}

// ─── Verbindung ─────────────────────────────────────────────────────────────

/** Wartet, bis alle Kandidaten gesammelt sind – das Signal muss vollständig in einen QR-Code passen. */
function gatherCandidates(pc: RTCPeerConnection): Promise<void> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve();
      return;
    }
    const timer = window.setTimeout(resolve, ICE_GATHER_TIMEOUT_MS);
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') {
        window.clearTimeout(timer);
        resolve();
      }
    });
  });
}

/** Eine Sync-Verbindung; `channel` löst auf, sobald der DataChannel offen ist. */
export class PeerLink {
  readonly pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  readonly channel: Promise<RTCDataChannel>;
  private resolveChannel: (channel: RTCDataChannel) => void = () => undefined;
  private rejectChannel: (error: Error) => void = () => undefined;
  private timer: number | undefined;

  constructor() {
    this.channel = new Promise((resolve, reject) => {
      this.resolveChannel = resolve;
      this.rejectChannel = reject;
    });
    this.pc.addEventListener('connectionstatechange', () => {
      if (this.pc.connectionState === 'failed') this.fail('Die Verbindung ist abgebrochen.');
    });
  }

  private watch(channel: RTCDataChannel) {
    channel.binaryType = 'arraybuffer';
    channel.addEventListener('open', () => {
      window.clearTimeout(this.timer);
      this.resolveChannel(channel);
    });
  }

  private fail(message: string) {
    window.clearTimeout(this.timer);
    this.rejectChannel(new Error(message));
  }

  /** Ab jetzt läuft die Uhr: Kommt keine Verbindung zustande, meldet `channel` einen Fehler. */
  private startTimeout() {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(
      () => this.fail('Keine Verbindung – sind beide Geräte im selben WLAN?'),
      CONNECT_TIMEOUT_MS,
    );
  }

  /** Gerät A: Angebot erstellen. `direction` = ob A seine Daten sendet oder empfängt. */
  static async createOffer(direction: SyncDirection): Promise<{ link: PeerLink; code: string }> {
    const link = new PeerLink();
    link.watch(link.pc.createDataChannel(CHANNEL_LABEL, { ordered: true }));
    await link.pc.setLocalDescription(await link.pc.createOffer());
    await gatherCandidates(link.pc);
    const description = link.pc.localDescription;
    if (!description) throw new Error('Das Angebot konnte nicht erstellt werden.');
    return { link, code: encodeSignal(signalFromDescription(description, direction)) };
  }

  /** Gerät B: Angebot einlesen und Antwort erstellen. */
  static async acceptOffer(offerCode: string): Promise<{ link: PeerLink; code: string; direction: SyncDirection }> {
    const offer = decodeSignal(offerCode);
    if (offer.kind !== 'offer')
      throw new Error('Das ist der Antwort-Code – bitte den Code des anderen Geräts scannen.');
    const link = new PeerLink();
    link.pc.addEventListener('datachannel', (event) => link.watch(event.channel));
    await link.pc.setRemoteDescription(descriptionFromSignal(offer));
    await link.pc.setLocalDescription(await link.pc.createAnswer());
    await gatherCandidates(link.pc);
    const description = link.pc.localDescription;
    if (!description) throw new Error('Die Antwort konnte nicht erstellt werden.');
    link.startTimeout();
    return {
      link,
      code: encodeSignal(signalFromDescription(description, offer.direction)),
      direction: offer.direction,
    };
  }

  /** Gerät A: Antwort von B einlesen – danach verbinden sich die Geräte. */
  async acceptAnswer(answerCode: string): Promise<void> {
    const answer = decodeSignal(answerCode);
    if (answer.kind !== 'answer') throw new Error('Das ist wieder ein Angebot – bitte den Antwort-Code scannen.');
    this.startTimeout();
    await this.pc.setRemoteDescription(descriptionFromSignal(answer));
  }

  close() {
    window.clearTimeout(this.timer);
    this.pc.close();
  }
}

// ─── Übertragung ────────────────────────────────────────────────────────────

const CHUNK_SIZE = 64 * 1024;
/** Puffer nicht überfüllen: über dieser Menge warten, bis der Kanal nachgeschickt hat. */
const MAX_BUFFERED = 4 * 1024 * 1024;

type SyncMessage =
  | { type: 'meta'; size: number; subscriptions: number; documents: number }
  | { type: 'end' }
  | { type: 'ack' }
  | { type: 'declined' }
  | { type: 'error'; message: string };

function sendMessage(channel: RTCDataChannel, message: SyncMessage) {
  channel.send(JSON.stringify(message));
}

function waitForDrain(channel: RTCDataChannel): Promise<void> {
  if (channel.bufferedAmount <= MAX_BUFFERED) return Promise.resolve();
  return new Promise((resolve) => {
    channel.bufferedAmountLowThreshold = MAX_BUFFERED / 4;
    channel.addEventListener('bufferedamountlow', () => resolve(), { once: true });
  });
}

function nextMessage(channel: RTCDataChannel): Promise<SyncMessage> {
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      cleanup();
      resolve(JSON.parse(event.data) as SyncMessage);
    };
    const onClose = () => {
      cleanup();
      reject(new Error('Das andere Gerät hat die Verbindung beendet.'));
    };
    const cleanup = () => {
      channel.removeEventListener('message', onMessage);
      channel.removeEventListener('close', onClose);
    };
    channel.addEventListener('message', onMessage);
    channel.addEventListener('close', onClose);
  });
}

/**
 * Sendet das ZIP-Backup (Abos, Kategorien, Einstellungen, Dokumente) in Stücken und wartet auf die
 * Bestätigung des Empfängers. Liefert false, wenn dieser die Übernahme abgelehnt hat.
 */
export async function sendBackupOver(
  channel: RTCDataChannel,
  backup: { blob: Blob; subscriptions: number; documents: number },
  onProgress: (share: number) => void,
): Promise<boolean> {
  const { blob } = backup;
  sendMessage(channel, {
    type: 'meta',
    size: blob.size,
    subscriptions: backup.subscriptions,
    documents: backup.documents,
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    await waitForDrain(channel);
    channel.send(bytes.slice(offset, offset + CHUNK_SIZE));
    onProgress(Math.min(1, (offset + CHUNK_SIZE) / bytes.length));
  }
  sendMessage(channel, { type: 'end' });
  const reply = await nextMessage(channel);
  if (reply.type === 'error') throw new Error(reply.message);
  return reply.type === 'ack';
}

/** Empfängt ein ZIP-Backup; `onMeta` meldet vorab Grösse und Umfang. */
export function receiveBackupOver(
  channel: RTCDataChannel,
  onMeta: (meta: { size: number; subscriptions: number; documents: number }) => void,
  onProgress: (share: number) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const parts: ArrayBuffer[] = [];
    let expected = 0;
    let received = 0;
    const onMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') {
        const chunk = event.data as ArrayBuffer;
        parts.push(chunk);
        received += chunk.byteLength;
        onProgress(expected ? Math.min(1, received / expected) : 0);
        return;
      }
      const message = JSON.parse(event.data) as SyncMessage;
      if (message.type === 'meta') {
        expected = message.size;
        onMeta(message);
      } else if (message.type === 'end') {
        cleanup();
        if (received !== expected) reject(new Error('Die Übertragung ist unvollständig.'));
        else resolve(new Blob(parts, { type: 'application/zip' }));
      }
    };
    const onClose = () => {
      cleanup();
      reject(new Error('Das andere Gerät hat die Verbindung beendet.'));
    };
    const cleanup = () => {
      channel.removeEventListener('message', onMessage);
      channel.removeEventListener('close', onClose);
    };
    channel.addEventListener('message', onMessage);
    channel.addEventListener('close', onClose);
  });
}

/** Rückmeldung des Empfängers an den Sender. */
export function replyToSender(channel: RTCDataChannel, outcome: 'ack' | 'declined' | { error: string }) {
  if (channel.readyState !== 'open') return;
  sendMessage(channel, typeof outcome === 'string' ? { type: outcome } : { type: 'error', message: outcome.error });
}
