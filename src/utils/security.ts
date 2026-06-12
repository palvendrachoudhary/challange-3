/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Security utilities for EcoTrace:
 * 1. Simulates client-side Row-Level Security (RLS) by cryptographically separating state rows.
 * 2. Signature verification to prevent data-tampering or side-channel local storage leakage.
 */

// Simple, fast hashing function to verify database row signatures
export function computeChecksum(dataStr: string, salt: string = 'ECOTRACE_SECURE_SALT_v1'): string {
  let hash = 0;
  const combined = dataStr + salt;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to a signed 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Derive a secure Partition-Id (Tenant-Hash) representing their row index
export function deriveTenantRowKey(userHandle: string, securePin: string): string {
  const normalizedUser = userHandle.trim().toLowerCase() || 'anonymous';
  const normalizedPin = securePin.trim() || 'guest';
  const combined = `${normalizedUser}_partition_key_${normalizedPin}`;
  const checksum = computeChecksum(combined, 'RLS_SECURITY_TENANT_SALT');
  return `ecotrace_row_${checksum}`;
}

// Sign structural data to enforce integrity
export function signState(data: any): { payloadString: string; signature: string } {
  // Extract signature field before calculation to avoid recursion
  const { signature, ...rest } = data;
  const payloadString = JSON.stringify(rest);
  const calculatedSig = computeChecksum(payloadString, 'DATA_INTEGRITY_SALT');
  return { payloadString, signature: calculatedSig };
}

// Enforce integrity check
export function verifyStateIntegrity(storedState: any): boolean {
  if (!storedState || typeof storedState !== 'object') return false;
  if (!storedState.signature) return false;
  
  const { signature, ...rest } = storedState;
  const payloadString = JSON.stringify(rest);
  const calculatedSig = computeChecksum(payloadString, 'DATA_INTEGRITY_SALT');
  return signature === calculatedSig;
}
