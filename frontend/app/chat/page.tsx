"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare, Search, UserPlus } from "lucide-react";
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
  receiver: User;
  content: string;
  createdAt: string;
}

interface Conversation {
  user: User;
  lastMessage: Message;
}

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  // Initial Data Load
  useEffect(() => {
    const initChat = async () => {
      try {
        const u = await getAuthProfile();
        if (u) setCurrentUser(u);
        
        await loadConversations();
      } catch (error) {
        console.error("Failed to init chat", error);
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, []);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/chat/conversations`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Socket setup
  useEffect(() => {
    if (!currentUser) return;

    const newSocket = io(API_URL, { withCredentials: true });

    newSocket.on("connect", () => {
      newSocket.emit("join_own_room", currentUser._id);
    });

    newSocket.on("receive_message", (msg: Message) => {
      // If the message is for the currently active chat, append it
      setActiveChat((currentActive) => {
        if (
          currentActive && 
          (msg.sender._id === currentActive._id || msg.receiver._id === currentActive._id)
        ) {
          setMessages((prev) => [...prev, msg]);
        }
        return currentActive;
      });
      
      // Always refresh conversations list so side panel shows latest message
      loadConversations();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Load chat history when switching active chat
  useEffect(() => {
    if (!activeChat) return;

    const loadMessages = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/chat/messages?userId=${activeChat._id}`, {
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
        console.error("Failed to load messages", error);
      }
    };
    loadMessages();
  }, [activeChat]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // User Search
  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/user/search?query=${searchQuery}`);
        if (res.ok) {
          const data = await res.json();
          // filter out self
          setSearchResults(data.filter((u: User) => u._id !== currentUser?._id));
        }
      } catch (error) {
        console.error(error);
      }
    };
    
    const timeoutId = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUser]);

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket || !currentUser || !activeChat) return;

    socket.emit("send_message", {
      senderId: currentUser._id,
      receiverId: activeChat._id,
      content: inputValue,
    });

    setInputValue("");
  };

  const startChatWith = (user: User) => {
    setSearchQuery("");
    setSearchResults([]);
    setActiveChat(user);
    
    // Optimistically add to conversations list if not there
    if (!conversations.find((c) => c.user._id === user._id)) {
      setConversations([{
        user,
        lastMessage: { _id: "new", content: "Say hi!", createdAt: new Date().toISOString() } as Message
      }, ...conversations]);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">Loading chat...</div>
      </AppLayout>
    );
  }

  if (!currentUser) {
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
      <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex pt-6 px-4 gap-4">
        
        {/* Left Side: Friends/Conversations */}
        <Card className="w-1/3 flex flex-col border-muted bg-background/50 backdrop-blur overflow-hidden">
          <CardHeader className="border-b bg-card p-4 space-y-4">
            <CardTitle>Chats</CardTitle>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users to chat..."
                className="pl-9 bg-background/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          
          <div className="flex-1 overflow-y-auto">
            {searchQuery && searchResults.length > 0 ? (
              <div className="p-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2 block">Search Results</span>
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => startChatWith(user)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.pfp} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-semibold text-sm truncate">{user.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground text-sm">
                    No active chats. Search for a friend above to start chatting!
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.user._id}
                      onClick={() => setActiveChat(conv.user)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        activeChat?._id === conv.user._id ? "bg-muted" : "hover:bg-muted/50"
                      }`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conv.user.pfp} />
                        <AvatarFallback>{conv.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex justify-between items-baseline shrink-0">
                          <span className="font-semibold text-sm">{conv.user.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate h-4">
                          {conv.lastMessage?.content}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Right Side: Active Chat Pane & Messages */}
        <Card className="w-2/3 flex flex-col border-muted bg-background/50 backdrop-blur overflow-hidden">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b bg-card p-4 flex flex-row items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={activeChat.pfp} />
                  <AvatarFallback>{activeChat.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold">{activeChat.name}</span>
                  <span className="text-xs text-muted-foreground">{activeChat.email}</span>
                </div>
              </CardHeader>
              
              {/* Messages Body */}
              <CardContent className="flex-1 flex flex-col p-4 overflow-hidden gap-4">
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto pr-4 space-y-4"
                >
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      Be the first to say hi to {activeChat.name}!
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = msg.sender?._id === currentUser._id;
                      const isDiffSender = index === 0 || messages[index - 1].sender?._id !== msg.sender?._id;

                      return (
                        <div 
                          key={msg._id || index}
                          className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"} ${isDiffSender ? "mt-4" : "mt-1"}`}
                        >
                          <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div 
                              className={`px-4 py-2 mt-1 rounded-2xl max-w-[400px] text-sm ${
                                isMe 
                                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                                  : "bg-muted text-foreground border border-border/50 shadow-sm rounded-tl-sm"
                              }`}
                              style={{ wordBreak: "break-word" }}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input Bar */}
                <form onSubmit={sendMessage} className="flex gap-2 shrink-0 pt-2 border-t">
                  <Input
                    placeholder={`Message ${activeChat.name}...`}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 bg-background/50"
                  />
                  <Button type="submit" disabled={!inputValue.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            // No Active Chat State
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <h2 className="text-xl font-semibold mb-2">WhatsApp for OpenBox</h2>
              <p className="max-w-[280px] text-center text-sm">
                Select a conversation from the left or search for a friend to start chatting.
              </p>
            </div>
          )}
        </Card>

      </div>
    </AppLayout>
  );
}
