import { useState, useEffect } from "react";
import { FeaturedEvent } from "@interfaces";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Button } from "@components/ui/button";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { createClient } from "@utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface EventFormProps {
  event: Partial<FeaturedEvent>;
  onSave: (event: Partial<FeaturedEvent>) => Promise<void>;
  onCancel?: () => void;
  buttonText?: string;
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = 12 + Math.floor(i / 4);
  const minute = (i % 4) * 15;
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
});

// Helper to combine date and time strings into a Date object
function combineDateAndTime(date: Date, time: string): Date {
  const [timeStr, ampm] = time.split(' ');
  const [hours, minutesStr] = timeStr.split(':');
  let hoursNum = Number(hours);
  const minutes = Number(minutesStr);
  if (ampm === 'PM' && hoursNum < 12) hoursNum += 12;
  if (ampm === 'AM' && hoursNum === 12) hoursNum = 0;
  const combined = new Date(date);
  combined.setHours(hoursNum, minutes, 0, 0);
  return combined;
}

export default function EventForm({ event, onSave, onCancel, buttonText = "Save" }: EventFormProps) {
  const [formData, setFormData] = useState(event);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const supabase = createClient();
  
  const handleChange = (field: keyof FeaturedEvent, value: string | string[] | boolean | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Dynamically update description with selected time
  useEffect(() => {
    if (!selectedTime) return;
    let desc = formData.description || "";
    // Remove any previous 'Starts @ ... CST' from the description
    desc = desc.replace(/Starts @ [0-9]{1,2}:[0-9]{2} (AM|PM) CST\s*/g, "").trim();
    desc = `Starts @ ${selectedTime} CST\n` + desc;
    setFormData(prev => ({ ...prev, description: desc }));
  }, [selectedTime, formData.description]);
  
  // Combine date and time into ISO string when both are selected
  useEffect(() => {
    if (formData.date && selectedTime) {
      const dateObj = new Date(formData.date);
      if (!isNaN(dateObj.getTime())) {
        const combined = combineDateAndTime(dateObj, selectedTime);
        setFormData(prev => ({ ...prev, date: combined.toISOString() }));
      }
    }
  }, [formData.date, selectedTime]);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, GIF, or WEBP image.');
      return;
    }
    
    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File is too large. Maximum size is 5MB.');
      return;
    }
    
    try {
      const loadingToast = toast.loading('Uploading image...');
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `events/${fileName}`;
      
      // Upload to Supabase - skip bucket check since we created it manually
      const { error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600'
        });
        
      if (error) {
        console.error('Supabase upload error:', error);
        toast.dismiss(loadingToast);
        toast.error(`Upload failed: ${error.message}`);
        return;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
        
      // Update form data with the new image URL
      handleChange('imageSrc', publicUrlData.publicUrl);
      
      toast.dismiss(loadingToast);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };
  
  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.imageSrc) {
      toast.error("Please fill in all required fields (title, description, and image)");
      return;
    }
    try {
      console.log("Submitting event:", formData);
      toast.loading("Submitting event...");
      await onSave(formData);
      toast.dismiss();
      toast.success("Event submitted!");
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.dismiss();
      toast.error("Failed to save event. Please try again.");
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title || ""}
            onChange={(e) => handleChange("title", e.target.value)}
          />
        </div>
        <div className="flex flex-row gap-2">
          <div className="flex-1 flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <DatePicker
              id="date"
              selected={formData.date ? new Date(formData.date) : null}
              onChange={(date: Date | null) => {
                if (date instanceof Date && !isNaN(date.getTime())) {
                  handleChange("date", date.toISOString().split("T")[0]);
                } else {
                  handleChange("date", "");
                }
              }}
              dateFormat="MMMM d, yyyy"
              placeholderText="Select date"
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              autoComplete="off"
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <Label htmlFor="time">Time</Label>
            <select
              id="time"
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              autoComplete="off"
            >
              <option value="">Select time</option>
              {TIME_OPTIONS.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="imageSrc">Image</Label>
          <div className="flex flex-col gap-2">
            <Input
              type="file"
              accept="image/jpeg, image/png, image/gif, image/webp"
              className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
              onChange={handleImageUpload}
            />
            {formData.imageSrc && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1">Current image:</p>
                <div className="relative w-full h-20">
                  <Image
                    src={formData.imageSrc}
                    alt="Preview"
                    fill
                    className="object-contain rounded"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <Label htmlFor="imageAlt">Image Alt Text</Label>
          <Input
            id="imageAlt"
            value={formData.imageAlt || ""}
            onChange={(e) => handleChange("imageAlt", e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="link">Link (Optional)</Label>
        <Input
          id="link"
          value={formData.link || ""}
          onChange={(e) => handleChange("link", e.target.value)}
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          variant="gold"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
} 