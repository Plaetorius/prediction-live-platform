"use client"

import { createSupabaseClient } from "@/lib/supabase/client"
import { RealtimePayload } from "@/lib/types"
import { useState } from "react";

interface Message {
  content: string;
}

export default function Home() {
  const testMessage: Message = { content: "I am a test message" }
  const [messages, setMessages] = useState<Message[]>([testMessage])

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    return <>Unable to create Supabase client</>

  const supabase = createSupabaseClient()
  
  const myChannel = supabase.channel("test-channel", {
    config: {
      broadcast: {
        ack: true,
        self: true,
      }
    }
  })

  // console.log("MY CHANNEL", myChannel)

  async function messageReceived(payload: RealtimePayload) {
    if (!(payload.payload && typeof payload.payload === "object" && 'message' in payload.payload))
      return;
    const message = (payload.payload as { message: string }).message
    console.log(message)
    setMessages([...messages, { content: message }])
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
      payload: { message: "Salut Val" },
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