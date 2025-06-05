"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@contexts/AppContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { toast } from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import { useAlertBanner } from "@hooks/useAlertBanner";

// Import the color wheel component
import { HexColorPicker } from "react-colorful";

export default function AlertBannerTab() {
  const { getFeatureFlag } = useAppContext();
  const { alertBanner, updateBanner, isLoading, error } = useAlertBanner();
  const showAlertBanner = getFeatureFlag("showAlertBanner");

  const [alertBannerState, setAlertBannerState] = useState({
    message: "",
    code: "",
    backgroundColor: "#E6B325",
    textColor: "#000000",
  });

  const [alertBannerErrors, setAlertBannerErrors] = useState<{
    message?: string;
    backgroundColor?: string;
    textColor?: string;
  }>({});

  // Track visibility of each color picker
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showTextPicker, setShowTextPicker] = useState(false);

  const resetBackgroundColor = () => {
    setAlertBannerState(prev => ({
      ...prev,
      backgroundColor: "#E6B325"
    }));
  };

  const resetTextColor = () => {
    setAlertBannerState(prev => ({
      ...prev,
      textColor: "#000000"
    }));
  };

  useEffect(() => {
    if (alertBanner) {
      setAlertBannerState({
        message: alertBanner.message || "",
        code: alertBanner.code || "",
        backgroundColor: alertBanner.backgroundColor || "#E6B325",
        textColor: alertBanner.textColor || "#000000",
      });
    }
  }, [alertBanner]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load alert banner");
    }
  }, [error]);

  const handleAlertBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAlertBannerState((prev) => ({ ...prev, [name]: value }));
  };

  const validateAlertBanner = () => {
    const errors: {
      message?: string;
      backgroundColor?: string;
      textColor?: string;
    } = {};

    if (!alertBannerState.message.trim()) {
      errors.message = "Message is required";
    }

    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(alertBannerState.backgroundColor)) {
      errors.backgroundColor = "Must be a valid hex color (e.g. #E6B325)";
    }

    if (!hexColorRegex.test(alertBannerState.textColor)) {
      errors.textColor = "Must be a valid hex color (e.g. #000000)";
    }

    setAlertBannerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveAlertBanner = async () => {
    if (!alertBanner?.id) {
      toast.error("No alert banner found to update");
      return;
    }

    if (validateAlertBanner()) {
      try {
        await updateBanner(alertBanner.id, alertBannerState);
        toast.success("Alert banner updated successfully");
      } catch (error) {
        toast.error("Failed to update alert banner");
      }
    } else {
      toast.error("Please fix the errors before saving");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Banner</CardTitle>
        <CardDescription>
          Configure the alert banner that appears at the top of your site
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!showAlertBanner && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3">
            <AlertTriangle className="text-yellow-500" />
            <p className="text-sm text-yellow-500">
              Alert Banner is currently disabled. Enable it in the Feature
              Flags tab to display the banner.
            </p>
          </div>
        )}

        <div
          className="space-y-4 transition-opacity duration-200"
          style={{ opacity: showAlertBanner ? 1 : 0.5 }}
        >
          <div>
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              name="message"
              value={alertBannerState.message}
              onChange={handleAlertBannerChange}
              placeholder="Enter alert message"
              disabled={!showAlertBanner || isLoading}
            />
            {alertBannerErrors.message && (
              <p className="text-red-500 text-xs mt-1">
                {alertBannerErrors.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="code">Code (Optional)</Label>
            <Input
              id="code"
              name="code"
              value={alertBannerState.code}
              onChange={handleAlertBannerChange}
              placeholder="Enter code or identifier"
              disabled={!showAlertBanner || isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Background Color Picker Section */}
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="backgroundColor"
                  name="backgroundColor"
                  value={alertBannerState.backgroundColor}
                  onChange={handleAlertBannerChange}
                  placeholder="#E6B325"
                  disabled={!showAlertBanner || isLoading}
                />
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border-2 border-white flex-shrink-0"
                  style={{ backgroundColor: alertBannerState.backgroundColor }}
                  onClick={() => setShowBgPicker((prev) => !prev)}
                  aria-label="Pick background color"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetBackgroundColor}
                  disabled={!showAlertBanner || isLoading || alertBannerState.backgroundColor === "#E6B325"}
                >
                  Reset
                </Button>
              </div>
              {alertBannerErrors.backgroundColor && (
                <p className="text-red-500 text-xs mt-1">
                  {alertBannerErrors.backgroundColor}
                </p>
              )}
              {showBgPicker && showAlertBanner && !isLoading && (
                <div className="mt-2 max-w-[240px]">
                  <HexColorPicker
                    color={alertBannerState.backgroundColor}
                    onChange={(color) =>
                      setAlertBannerState((prev) => ({
                        ...prev,
                        backgroundColor: color,
                      }))
                    }
                  />
                </div>
              )}
            </div>

            {/* Text Color Picker Section */}
            <div>
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="textColor"
                  name="textColor"
                  value={alertBannerState.textColor}
                  onChange={handleAlertBannerChange}
                  placeholder="#000000"
                  disabled={!showAlertBanner || isLoading}
                />
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border-2 border-white flex-shrink-0"
                  style={{ backgroundColor: alertBannerState.textColor }}
                  onClick={() => setShowTextPicker((prev) => !prev)}
                  aria-label="Pick text color"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTextColor}
                  disabled={!showAlertBanner || isLoading || alertBannerState.textColor === "#000000"}
                >
                  Reset
                </Button>
              </div>
              {alertBannerErrors.textColor && (
                <p className="text-red-500 text-xs mt-1">
                  {alertBannerErrors.textColor}
                </p>
              )}
              {showTextPicker && showAlertBanner && !isLoading && (
                <div className="mt-2 max-w-[240px]">
                  <HexColorPicker
                    color={alertBannerState.textColor}
                    onChange={(color) =>
                      setAlertBannerState((prev) => ({
                        ...prev,
                        textColor: color,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div
            className="mt-4 p-4 rounded"
            style={{
              backgroundColor: alertBannerState.backgroundColor,
              color: alertBannerState.textColor,
            }}
          >
            <p className="font-medium">
              Preview:{" "}
              {alertBannerState.message ||
                "Your alert message will appear here"}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={saveAlertBanner}
          disabled={!showAlertBanner || isLoading}
          variant="gold"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
