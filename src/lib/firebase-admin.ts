import * as admin from 'firebase-admin';

const firebaseAdminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

export const initFirebaseAdmin = () => {
    if (!admin.apps.length) {
        return admin.initializeApp({
            credential: admin.credential.cert(firebaseAdminConfig),
        });
    }
    return admin.app();
};
