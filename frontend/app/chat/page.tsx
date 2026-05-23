"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare } from "lucide-react";
import io, { Socket } from "socket.io-client";
import { getAuthProfile, API_URL } from "@/app/service/app";

interface User {
  _id: string;
  name: string;
  email: string;
  pfp?: string;
}

interface Message {
  _id: string;
  sender: User;
  content: string;
  room: string;
  createdAt: string;
}

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  
  const room = "general"; // Global room for chatting with friends about projects

  useEffect(() => {
    const initChat = async () => {
      try {
        const u = await getAuthProfile();
        if (u) {
          setUser(u);
        }
        
        // Fetch message history
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/chat/messages?room=${room}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Failed to init chat", error);
      } finally {
        setLoading(false);
      }
    };
    
    initChat();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Setup Socket
    const newSocket = io(API_URL, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      newSocket.emit("join_room", room);
    });

    newSocket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket || !user) return;

    socket.emit("send_message", {
      senderId: user._id,
      content: inputValue,
      room,
    });

    setInputValue("");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">Loading chat...</div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          You must be logged in to chat.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col pt-6 px-4">
        <Card className="flex flex-col flex-1 border-muted bg-background/50 backdrop-blur">
          <CardHeader className="border-b bg-card">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              General Project Chat
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-4 overflow-hidden gap-4">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto pr-4 space-y-4"
            >
              {messages.map((msg, index) => {
                const isMe = msg.sender?._id === user._id;
                const isDiffSender = index === 0 || messages[index - 1].sender?._id !== msg.sender?._id;

                return (
                  <div 
                    key={msg._id || index}
                    className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"} ${isDiffSender ? 'mt-4' : 'mt-1'}`}
                  >
                    {isDiffSender && !isMe ? (
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={msg.sender?.pfp} />
                        <AvatarFallback>{msg.sender?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8 shrink-0" />
                    )}
                    
                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {isDiffSender && !isMe && (
                        <span className="text-xs text-muted-foreground mb-1 px-1">
                          {msg.sender?.name || 'Unknown User'}
                        </span>
                      )}
                      <div 
                        className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${
                          isMe 
                            ? "bg-primary text-primary-foreground rounded-tr-sm" 
                            : "bg-muted text-foreground rounded-tl-sm"
                        }`}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={sendMessage} className="flex gap-2 shrink-0 pt-2 border-t">
              <Input
                placeholder="Message the general chat..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!inputValue.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
