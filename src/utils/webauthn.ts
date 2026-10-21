/**
 * Lokale Biometrie über WebAuthn (Face ID, Touch ID, Windows Hello, Android-Fingerabdruck).
 * Ohne Server wird die Signatur nicht geprüft – das Betriebssystem bestätigt nur, dass die
 * berechtigte Person vor dem Gerät sitzt. Das reicht als Sichtschutz, ist aber keine Verschlüsselung.
 */

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function toBase64Url(buffer: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Ob das Gerät einen eingebauten Biometrie-/Geräte-PIN-Sensor anbietet. */
export async function checkBiometricSupport(): Promise<boolean> {
  try {
    return (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential !== undefined &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}

/**
 * Legt einmalig einen Gerätschlüssel an (beim Aktivieren in den Einstellungen).
 * Ohne diese Registrierung findet `credentials.get` nichts, was es abfragen könnte.
 * Liefert die Credential-ID (base64url) oder null bei Abbruch.
 */
export async function registerBiometric(): Promise<string | null> {
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32),
        rp: { name: 'HardCost' },
        user: { id: randomBytes(16), name: 'HardCost', displayName: 'HardCost App-Sperre' },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256 (Windows Hello)
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'discouraged',
        },
        attestation: 'none',
        timeout: 60_000,
      },
    });
    return credential instanceof PublicKeyCredential ? toBase64Url(credential.rawId) : null;
  } catch (error) {
    console.warn('Biometrie-Registrierung fehlgeschlagen oder abgebrochen:', error);
    return null;
  }
}

/** Fragt Face ID / Fingerabdruck für den registrierten Schlüssel ab. */
export async function promptBiometricAuth(credentialId: string): Promise<boolean> {
  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        allowCredentials: [{ type: 'public-key', id: fromBase64Url(credentialId), transports: ['internal'] }],
        userVerification: 'required',
        timeout: 60_000,
      },
    });
    return credential instanceof PublicKeyCredential;
  } catch (error) {
    console.warn('Biometrische Abfrage fehlgeschlagen oder abgebrochen:', error);
    return false;
  }
}
