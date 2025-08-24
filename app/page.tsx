"use client"

import { createClient } from "@supabase/supabase-js"
import { RealtimePayload } from "@/lib/types"
import { useState } from "react";

interface Message {
  content: string;
}

export default function Home() {
  const testMessage: Message = { content: "I am a test message" }
  const [messages, setMessages] = useState<Message[]>([testMessage])

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    return <>Unable to createJSClient</>

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  
  const myChannel = supabase.channel("test-channel", {
    config: {
      broadcast: {
        ack: true
      }
    }
  })

  // console.log("MY CHANNEL", myChannel)

  async function messageReceived(payload: RealtimePayload) {
    console.log(payload.payload.message)
    setMessages([...messages, { content: payload.payload.message }])
    console.log("MESSAGE RECEIVED TRIGGER")
    console.log(payload)
  }

  myChannel
    .on(
      'broadcast',
      { event: 'shout' }, // use "*" to listen to all events
      (payload) => messageReceived(payload)
    )
    .subscribe()

  function testFunction() {
    myChannel.send({
      type: 'broadcast',
      event: 'shout',
      payload: { message: "hi" },
    })
  }

  myChannel.subscribe(async (status) => {
    if (status !== "SUBSCRIBED") return;

    const serverResponse = await myChannel.send({
      type: 'broadcast',
      event: 'acknowledge',
      payload: { message: "hi" },
    })

    console.log("serverResponse", serverResponse)
  })

  return (
    <main>
      <h1>Prediction.Live</h1>
      <button onClick={testFunction}>
        Click me
      </button>
      {messages.map((message, index) => {
        return <div key={index}>Message: {message.content}</div>
      })}
    </main>
  )
}