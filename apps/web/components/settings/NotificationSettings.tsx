"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { Bell, Mail, CheckCircle, AlertTriangle } from "lucide-react";

export function NotificationSettings() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Configure how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="browser-notif" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Browser Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive desktop push notifications
            </p>
          </div>
          <Switch
            id="browser-notif"
            checked={settings.enableBrowserNotifications}
            onCheckedChange={(checked) => updateSettings({ enableBrowserNotifications: checked })}
          />
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notif" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email
            </p>
          </div>
          <Switch
            id="email-notif"
            checked={settings.enableEmailNotifications}
            onCheckedChange={(checked) => updateSettings({ enableEmailNotifications: checked })}
          />
        </div>

        {/* Notification Triggers */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-3">Notify me when...</h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-complete" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Job Completes
                </Label>
                <p className="text-sm text-muted-foreground">
                  When a generation job finishes successfully
                </p>
              </div>
              <Switch
                id="notify-complete"
                checked={settings.notifyOnComplete}
                onCheckedChange={(checked) => updateSettings({ notifyOnComplete: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-error" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Job Errors
                </Label>
                <p className="text-sm text-muted-foreground">
                  When a generation job fails
                </p>
              </div>
              <Switch
                id="notify-error"
                checked={settings.notifyOnError}
                onCheckedChange={(checked) => updateSettings({ notifyOnError: checked })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
