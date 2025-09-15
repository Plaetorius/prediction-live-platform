"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Users, Zap } from "lucide-react";

export default function Home() {

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white">
              Prediction.Live
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Real-time prediction platform for gaming streams
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white">
              <Link href="/streams">
                <Play className="mr-2 h-4 w-4" />
                View Streams
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Link href="/profiles">
                <Users className="mr-2 h-4 w-4" />
                Browse Profiles
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </main>
  )
}