"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare, Search, UserPlus, Check } from "lucide-react";
import io, { Socket } from "socket.io-client";
import { getAuthProfile, API_URL, getFriends, addFriend, getMessages } from "@/app/service/app";
import { useToast } from "@/hooks/use-toast";

interface User {
  _id: string;
  name: string;
  email: string;
  pfp?: string;
  avatarUrl?: string;
}

interface Message {
  _id: string;
  sender: User;
  receiver: User;
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep activeChatRef updated so socket closures have latest state
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Initial Data Load
  useEffect(() => {
    const initChat = async () => {
      try {
        const payload = await getAuthProfile();
        // The API returns { user: { _id, name, ... } }
        if (payload && payload.user) {
          setCurrentUser(payload.user);
        } else if (payload && payload._id) {
          setCurrentUser(payload);
        }
        
        await loadFriends();
      } catch (error) {
        console.error("Failed to init chat", error);
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, []);

  const loadFriends = async () => {
    try {
      const data = await getFriends();
      setFriends(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading friends:", error);
      setFriends([]);
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
      const currentActive = activeChatRef.current;
      if (
        currentActive && 
        (msg.sender._id === currentActive._id || msg.receiver._id === currentActive._id)
      ) {
        setMessages((prev) => {
          // Prevent duplicate messages in UI by checking IDs
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Load chat history
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
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await fetch(`${API_URL}/user/search?q=${searchQuery}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Provide a fallback empty array if data.users is undefined
          const usersList = data.users || data || [];
          setSearchResults(
            Array.isArray(usersList) 
              ? usersList.filter((u: User) => u._id !== currentUser?._id)
              : []
          );
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

  const handleAddFriend = async (user: User) => {
    try {
      await addFriend(user._id);
      toast({ title: "Friend Added", description: `You can now chat with ${user.name}` });
      await loadFriends();
      setSearchQuery("");
      setSearchResults([]);
      setActiveChat(user);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Cannot Add Friend", description: error.message || "Failed to add friend" });
    }
  };

  const startChatWith = (user: User) => {
    setSearchQuery("");
    setSearchResults([]);
    setActiveChat(user);
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
            <CardTitle>Friends List</CardTitle>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search global users to add..."
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
                {searchResults.map((user) => {
                  const isFriend = Array.isArray(friends) && friends.some((f) => f._id === user._id);
                  return (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <Avatar className="w-10 h-10 cursor-pointer" onClick={() => isFriend && startChatWith(user)}>
                        <AvatarImage src={user.pfp || user.avatarUrl} />
                        <AvatarFallback>{(user.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden flex-1 cursor-pointer" onClick={() => isFriend && startChatWith(user)}>
                        <span className="font-semibold text-sm truncate">{user.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email || `@${user.username}`}</span>
                      </div>
                      
                      {isFriend ? (
                        <Button variant="ghost" size="icon" disabled className="text-green-500">
                          <Check className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => handleAddFriend(user)}>
                          <UserPlus className="w-4 h-4 text-primary" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {friends.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <UserPlus className="w-8 h-8 opacity-50" />
                    <span>No friends yet. Search above to add friends and start chatting!</span>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div
                      key={friend._id}
                      onClick={() => startChatWith(friend)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        activeChat?._id === friend._id ? "bg-muted" : "hover:bg-muted/50"
                      }`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={friend.pfp || friend.avatarUrl} />
                        <AvatarFallback>{(friend.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="font-semibold text-sm truncate">{friend.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{friend.email || `@${friend.username}`}</span>
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
                  <AvatarImage src={activeChat.pfp || activeChat.avatarUrl} />
                  <AvatarFallback>{(activeChat.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold">{activeChat.name}</span>
                  <span className="text-xs text-muted-foreground">{activeChat.email || `@${activeChat.username}`}</span>
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
                      Send your first message to {activeChat.name}!
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
              <h2 className="text-xl font-semibold mb-2">Your Friends</h2>
              <p className="max-w-[280px] text-center text-sm">
                Select a friend from the left or search someone globally to start a chat.
              </p>
            </div>
          )}
        </Card>

      </div>
    </AppLayout>
  );
}
