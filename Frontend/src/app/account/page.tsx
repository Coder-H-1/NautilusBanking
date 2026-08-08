"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import {
  Shield,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  User,
  Mail,
  Building2,
  Calendar,
  Undo2,
} from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/utils";

export default function AccountPage() {
  const { user, isAuthenticated, logout, refreshBalance } = useAuth();
  const router = useRouter();

  // Status & Details
  const [accountStatus, setAccountStatus] = useState<string>("active");
  const [deletionRequestedAt, setDeletionRequestedAt] = useState<string | null>(null);
  const [deletionScheduledFor, setDeletionScheduledFor] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete Account state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reactivate state
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [reactivateSuccess, setReactivateSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchStatus = async () => {
      setLoadingStatus(true);
      try {
        const res = await apiRequest<{
          success: boolean;
          status: string;
          deletion_requested_at: string | null;
          deletion_scheduled_for: string | null;
          days_remaining: number | null;
        }>("/account/status");

        if (res.data && res.data.success) {
          setAccountStatus(res.data.status);
          setDeletionRequestedAt(res.data.deletion_requested_at);
          setDeletionScheduledFor(res.data.deletion_scheduled_for);
          setDaysRemaining(res.data.days_remaining);
        }
      } catch (err) {
        console.warn("Could not fetch account status", err);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchStatus();
  }, [isAuthenticated]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>("/account/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      setPasswordLoading(false);
      if (res.error || !res.data?.success) {
        setPasswordError(res.error || "Password change failed.");
        return;
      }

      setPasswordSuccess(res.data.message || "Password changed successfully! A confirmation email was sent.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordLoading(false);
      setPasswordError(err instanceof Error ? err.message : "Password change failed");
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    setDeleteSuccess(null);

    if (!deletePassword) {
      setDeleteError("Password is required to request account deletion.");
      return;
    }

    if (deleteConfirmationText.trim().toUpperCase() !== "DELETE MY ACCOUNT") {
      setDeleteError('Please type "DELETE MY ACCOUNT" to confirm.');
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        scheduled_purge_date: string;
      }>("/account/delete", {
        method: "POST",
        body: JSON.stringify({
          password: deletePassword,
          confirmation: "DELETE MY ACCOUNT",
        }),
      });

      setDeleteLoading(false);
      if (res.error || !res.data?.success) {
        setDeleteError(res.error || "Failed to schedule account deletion.");
        return;
      }

      setAccountStatus("on-hold");
      setDeletionScheduledFor(res.data.scheduled_purge_date);
      setDeleteSuccess(res.data.message || "Account scheduled for deletion in 7 days.");
      setShowDeleteConfirm(false);
      setDeletePassword("");
      setDeleteConfirmationText("");
      await refreshBalance();
    } catch (err: unknown) {
      setDeleteLoading(false);
      setDeleteError(err instanceof Error ? err.message : "Account deletion request failed");
    }
  };

  const handleCancelDeletion = async () => {
    setReactivateLoading(true);
    setDeleteError(null);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>("/account/restore", {
        method: "POST",
      });

      setReactivateLoading(false);
      if (res.data?.success) {
        setAccountStatus("active");
        setDeletionRequestedAt(null);
        setDeletionScheduledFor(null);
        setDaysRemaining(null);
        setReactivateSuccess("Account reactivated successfully! Status is now active.");
        await refreshBalance();
      } else {
        setDeleteError(res.error || "Failed to reactivate account.");
      }
    } catch (err) {
      setReactivateLoading(false);
      setDeleteError("Reactivation request failed.");
    }
  };

  const isOnHold = accountStatus === "on-hold";

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="pb-6 border-b border-zinc-200">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
            SECURITY & ACCOUNT MANAGEMENT
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Account Settings
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-0.5">
          Manage your credentials, security preferences, and account lifecycle.
        </p>
      </div>

      {/* Status Warning Banner (if on-hold) */}
      {isOnHold && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-mono font-bold text-amber-900">
                ACCOUNT STATUS: ON-HOLD (DELETION SCHEDULED)
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed font-mono">
                Your account is currently suspended and queued for permanent deletion. Money transfers, QR payments, and faucet requests are disabled during the 7-day grace period.
              </p>
              {deletionScheduledFor && (
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-900 pt-1">
                  <Clock className="w-4 h-4 text-amber-700" />
                  Scheduled Purge Date: {new Date(deletionScheduledFor).toLocaleDateString()} (in ~{daysRemaining ?? 7} days)
                </div>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
            <span className="text-xs font-mono text-amber-800">
              Changed your mind? You can cancel the deletion and restore full access anytime before the 7-day period ends.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelDeletion}
              isLoading={reactivateLoading}
              className="border-amber-400 bg-white text-amber-900 hover:bg-amber-100 font-mono text-xs gap-1.5"
            >
              <Undo2 className="w-3.5 h-3.5" /> Cancel Deletion & Reactivate
            </Button>
          </div>
        </div>
      )}

      {reactivateSuccess && (
        <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-mono flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>{reactivateSuccess}</div>
        </div>
      )}

      {/* Grid: Account Overview & Change Password */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Info Card */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Profile Overview
            </CardTitle>
            <CardDescription className="text-xs font-mono">
              Verified identity on ledger.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs font-mono">
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100 space-y-2">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase block">Account Holder</span>
                <span className="font-semibold text-zinc-900 uppercase">{user?.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase block">Email Address</span>
                <span className="font-medium text-zinc-800">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-zinc-200">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase block">Bank Node</span>
                  <span className="font-bold text-zinc-900">{user?.bank_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase block">Bank User ID</span>
                  <span className="font-bold text-zinc-900">#{user?.id}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700">Account Status</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  isOnHold
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                }`}
              >
                {accountStatus}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="md:col-span-2 border border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Update Password
            </CardTitle>
            <CardDescription className="text-xs font-mono">
              Enter your current password to set a new secure password.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4">
              {passwordSuccess && (
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-mono flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>{passwordSuccess}</div>
                </div>
              )}

              {passwordError && (
                <Alert variant="error" title="Password Error">
                  {passwordError}
                </Alert>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-zinc-700">CURRENT PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-zinc-700">NEW PASSWORD</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-zinc-700">CONFIRM NEW PASSWORD</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={passwordLoading}
                className="font-mono text-xs gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Save New Password
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Danger Zone: Account Deletion */}
      <Card className="border border-red-200 bg-red-50/20 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            <CardTitle className="text-base font-bold text-red-900">Danger Zone: Account Deletion</CardTitle>
          </div>
          <CardDescription className="text-xs font-mono text-zinc-600">
            Requesting account deletion places your account in an <strong>on-hold</strong> state for a <strong>7-day grace period</strong>. After 7 days, your account and ledger entries will be permanently purged by our automated background service.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {deleteSuccess && (
            <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-mono flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>{deleteSuccess}</div>
            </div>
          )}

          {deleteError && (
            <Alert variant="error" title="Deletion Error">
              {deleteError}
            </Alert>
          )}

          {!showDeleteConfirm ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-white border border-red-200">
              <div>
                <h4 className="text-xs font-bold font-mono text-zinc-900">Schedule Account Deletion</h4>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  7-day soft-delete grace period with Brevo email confirmation.
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isOnHold}
                className="font-mono text-xs shrink-0"
              >
                {isOnHold ? "Already On-Hold" : "Delete Account"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleDeleteAccount} className="p-4 rounded-lg bg-white border border-red-300 space-y-4">
              <div className="p-3 rounded bg-red-100/60 border border-red-200 text-xs font-mono text-red-900">
                <strong>Warning:</strong> You are initiating a 7-day scheduled deletion. During this time, transfers and deposits will be disabled. To proceed, please provide your account password and confirm.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-zinc-700">ENTER ACCOUNT PASSWORD</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-zinc-700">
                  TYPE <strong className="text-red-600 font-mono">DELETE MY ACCOUNT</strong> TO CONFIRM
                </label>
                <input
                  type="text"
                  placeholder="DELETE MY ACCOUNT"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                    setDeleteConfirmationText("");
                  }}
                  className="font-mono text-xs flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={deleteLoading}
                  className="font-mono text-xs flex-1"
                >
                  CONFIRM & SCHEDULE DELETION
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
