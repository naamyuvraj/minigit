"use client";

import type React from "react";
import { useState, useEffect } from "react";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Edit, Lock, Upload, Save } from "lucide-react";

import { getUserProfile, updateUserProfile, updatePassword } from "../service/app";

// User Profile Type
interface UserProfile {
  name: string;
  email: string;
  bio: string;
  avatarUrl: string;
  totalCommits: number;
  totalChanges: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load Profile
  useEffect(() => {
    async function load() {
      try {
        const res = await getUserProfile();
        console.log("🔥 Profile API:", res);

        if (!res || !res.user) throw new Error("Invalid profile response");

        const u = res.user;
        const normalized: UserProfile = {
          name: u.name || "Unknown User",
          email: u.email || "",
          bio: u.bio || "",
          avatarUrl: u.avatarUrl || "",
          totalCommits: u.totalCommits || 0,
          totalChanges: u.totalChanges || 0,
        };

        setProfile(normalized);
        setEditedProfile(normalized);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Save Profile
  const handleSaveDetails = async () => {
    if (!editedProfile) return;

    try {
      const payload = {
        name: editedProfile.name,
        email: editedProfile.email,
        bio: editedProfile.bio,
        avatarUrl: editedProfile.avatarUrl,
      };

      const updated = await updateUserProfile(payload);
      if (!updated.user) return;

      const u = updated.user;
      setProfile((prev) => ({
        ...prev!,
        name: u.name || prev?.name || "",
        email: u.email || prev?.email || "",
        bio: u.bio || prev?.bio || "",
        avatarUrl: u.avatarUrl || prev?.avatarUrl || "",
      }));

      setIsEditingDetails(false);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleChangePassword = () => {
    if (newPassword === confirmPassword && newPassword.length >= 8) {
      setIsChangingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // Upload Avatar
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setEditedProfile((prev) =>
        prev ? { ...prev, avatarUrl: base64 } : prev
      );
      setProfile((prev) => (prev ? { ...prev, avatarUrl: base64 } : prev));
      
      // Auto-save the avatar when uploaded
      try {
        if (editedProfile) {
          await updateUserProfile({
            ...editedProfile,
            avatarUrl: base64,
          });
        }
      } catch (err) {
        console.error("Avatar update failed:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Loading & Error States
  if (loading) return <p className="p-8">Loading profile...</p>;
  if (error) return <p className="p-8 text-red-500">{error}</p>;
  if (!profile || !editedProfile) return null;

  const fallbackInitials = profile.name.substring(0, 2).toUpperCase();

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="container-safe max-w-4xl mx-auto py-8">
          {/* Profile Header */}
          <Card className="border-2 mb-8">
            <CardHeader className="pb-0">
              <div className="flex flex-col sm:flex-row sm:items-end gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-2 border-foreground">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-foreground text-background text-2xl font-black">
                        {fallbackInitials}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <label className="absolute bottom-0 right-0 bg-foreground text-background p-2 rounded-full cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-black mb-2">{profile.name}</h1>
                  <p className="text-muted-foreground text-sm">
                    {profile.email}
                  </p>
                  <p className="text-sm mt-2">{profile.bio}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Total Commits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black">{profile.totalCommits}</p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Total Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black">{profile.totalChanges}</p>
              </CardContent>
            </Card>
          </div>

          {/* Profile Edit Section */}
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Profile Details</CardTitle>

                <Dialog
                  open={isEditingDetails}
                  onOpenChange={setIsEditingDetails}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" /> Edit
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile Details</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={editedProfile.name}
                          onChange={(e) =>
                            setEditedProfile((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <Label>Bio</Label>
                        <Input
                          value={editedProfile.bio}
                          onChange={(e) =>
                            setEditedProfile((prev) => ({
                              ...prev,
                              bio: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingDetails(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveDetails}>
                        <Save className="w-4 h-4 mr-2" /> Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{profile.name}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Bio</p>
                  <p className="font-medium">{profile.bio}</p>
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Security</CardTitle>
                <Dialog
                  open={isChangingPassword}
                  onOpenChange={setIsChangingPassword}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Lock className="w-4 h-4" /> Change Password
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div>
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Confirm Password</Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>

                      {newPassword &&
                        confirmPassword &&
                        newPassword !== confirmPassword && (
                          <p className="text-sm text-red-600">
                            Passwords do not match
                          </p>
                        )}
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsChangingPassword(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          if (
                            newPassword !== confirmPassword ||
                            newPassword.length < 8
                          )
                            return;

                          try {
                            await updatePassword(newPassword);

                            alert("✅ Password changed successfully!");
                            setIsChangingPassword(false);
                            setNewPassword("");
                            setConfirmPassword("");
                          } catch (err: any) {
                            alert(err.message);
                          }
                        }}
                        disabled={
                          newPassword !== confirmPassword ||
                          newPassword.length < 8
                        }
                      >
                        Update Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Last changed recently
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
