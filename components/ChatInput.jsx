'use client';
import { db } from '@/firebase';
import useSWR from 'swr';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import ModelSelection from './ModelSelection';

function ChatInput({ chatId }) {
  const { data: session } = useSession();

  const [prompt, setPrompt] = useState('');

  const { data: model } = useSWR('model', { fallbackData: 'text-davinci-003' });

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!prompt) return;

    const input = prompt.trim();
    setPrompt('');

    const message = {
      text: input,
      createdAt: serverTimestamp(),
      user: {
        _id: session?.user?.email,
        name: session?.user.name,
        avatar: session?.user.image || `https://ui-avatars.com/api/?name=${session?.user?.name}`,
      },
    };

    await addDoc(collection(db, 'users', session?.user?.email, 'chats', chatId, 'messages'), message);

    const notification = toast.loading('ChatGPT is thinking...');

    await fetch('/api/askQuestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: input,
        chatId,
        model,
        session,
      }),
    }).then(() => {
      toast.success('ChatGPT has responded!', {
        id: notification,
      });
    });
  };

  return (
    <div className='bg-gray-700/50 text-gray-400 rounded-lg text-sm'>
      <form onSubmit={sendMessage} className='p-5 space-x-5 flex'>
        <input
          className='outline-none bg-transparent flex-1 disabled:cursor-not-allowed disabled:text-gray-300'
          disabled={!session}
          type='text'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='Type your message here...'
        />

        <button
          disabled={!prompt || !session}
          className='bg-[#11A37F] hover:opacity-50 text-white font-bold px-4 py-2 rounded disabled:bg-gray-300 disabled:cursor-not-allowed'
          type='submit'>
          <PaperAirplaneIcon className='w-4 h-4 -rotate-45' />
        </button>
      </form>

      <div className='md:hidden'>
        <ModelSelection />
      </div>
    </div>
  );
}

export default ChatInput;
