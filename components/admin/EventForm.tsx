import { useState } from "react";
import { FeaturedEvent } from "@interfaces";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Button } from "@components/ui/button";
import { Trash2, Plus } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { supabase } from "@lib/supabase";
import { v4 as uuidv4 } from "uuid";

interface EventFormProps {
  event: Partial<FeaturedEvent>;
  onSave: (event: Partial<FeaturedEvent>) => void;
  onCancel?: () => void;
  buttonText?: string;
}

export default function EventForm({ event, onSave, onCancel, buttonText = "Save" }: EventFormProps) {
  const [formData, setFormData] = useState(event);
  const [newBulletPoint, setNewBulletPoint] = useState("");
  
  const handleChange = (field: keyof FeaturedEvent, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddBulletPoint = () => {
    if (newBulletPoint.trim()) {
      setFormData(prev => ({
        ...prev,
        bulletPoints: [...(prev.bulletPoints || []), newBulletPoint.trim()]
      }));
      setNewBulletPoint("");
    }
  };
  
  const handleRemoveBulletPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bulletPoints: prev.bulletPoints?.filter((_, i) => i !== index) || []
    }));
  };
  
  const handleEditBulletPoint = (index: number, value: string) => {
    setFormData(prev => {
      const newBulletPoints = [...(prev.bulletPoints || [])];
      newBulletPoints[index] = value;
      return { ...prev, bulletPoints: newBulletPoints };
    });
  };
  
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
  
  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.imageSrc) {
      toast.error("Please fill in all required fields (title, description, and image)");
      return;
    }
    
    onSave(formData);
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
        
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            value={formData.date || ""}
            onChange={(e) => handleChange("date", e.target.value)}
          />
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
      
      <div>
        <Label>Bullet Points</Label>
        <div className="space-y-2 mt-2">
          {formData.bulletPoints?.map((point, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={point}
                onChange={(e) => handleEditBulletPoint(index, e.target.value)}
              />
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleRemoveBulletPoint(index)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          
          <div className="flex items-center space-x-2">
            <Input
              value={newBulletPoint}
              onChange={(e) => setNewBulletPoint(e.target.value)}
              placeholder="Add a bullet point"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddBulletPoint}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black bg-[#E6B325] text-[#000000] shadow-md hover:bg-[#FFD966] border border-[#B38A00] focus-visible:ring-[#E6B325]/50 font-extrabold tracking-wide uppercase h-10 px-5 py-2.5"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
} 