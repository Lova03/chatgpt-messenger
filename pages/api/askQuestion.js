import admin from 'firebase-admin';

import query from '@/lib/queryApi';
import { adminDb } from '@/firebaseAdmin';

export default async function handler(req, res) {
  const { prompt, chatId, model, session } = req.body;

  if (!session) {
    res.status(403).json({ answer: 'User is not logged in!' });
    return;
  }

  if (!prompt) {
    res.status(400).json({ answer: 'Please provide a prompt!' });
    return;
  }
  if (!chatId) {
    res.status(400).json({ answer: 'Please provide a valid chat ID!' });
    return;
  }

  const response = await query(prompt, model);

  const message = {
    text: response || 'ChatGPT was unable to find an answer for that!',
    createdAt: admin.firestore.Timestamp.now(),
    user: {
      _id: 'ChatGPT',
      name: 'ChatGPT',
      avatar: 'https://links.papareact.com/89k',
    },
  };

  await adminDb
    .collection('users')
    .doc(session?.user?.email)
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .add(message);

  res.status(200).json({ answer: message.text });
}
