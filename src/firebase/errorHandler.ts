export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  currentAuth?: { uid?: string | null; email?: string | null; emailVerified?: boolean; isAnonymous?: boolean }
): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    operationType,
    path,
    authInfo: {
      userId: currentAuth?.uid ?? null,
      email: currentAuth?.email ?? null,
      emailVerified: currentAuth?.emailVerified ?? false,
      isAnonymous: currentAuth?.isAnonymous ?? false,
    },
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));

  // Determine user friendly explanation
  let userFriendly = 'An error occurred while communicating with Firebase.';
  if (errMessage.includes('permission-denied') || errMessage.includes('Missing or insufficient permissions')) {
    userFriendly = `Permission Denied (${operationType} at ${path ?? 'document'}). Ensure you are authenticated and meet the permission rules (e.g. within 24-hour edit window).`;
  } else if (errMessage.includes('unavailable') || errMessage.includes('client is offline')) {
    userFriendly = 'Firebase service is currently unavailable or offline. Please check your network connection.';
  } else if (errMessage.includes('not-found')) {
    userFriendly = `Document not found at ${path ?? 'collection'}.`;
  } else if (errMessage.includes('quota') || errMessage.includes('Quota exceeded')) {
    userFriendly = 'Firebase project quota exceeded. Please check your Firebase billing or wait for daily reset.';
  }

  const customErr = new Error(userFriendly);
  (customErr as unknown as { rawInfo: FirestoreErrorInfo }).rawInfo = errInfo;
  throw customErr;
}
