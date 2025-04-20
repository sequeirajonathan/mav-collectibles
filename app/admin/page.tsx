"use client";

import { useState, useEffect, memo, useMemo } from 'react';
import { useAppContext, type FeaturedEvent } from '@/contexts/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Edit } from 'lucide-react';
import Image from 'next/image';
import { toast } from "react-hot-toast";
import { Checkbox } from '@/components/ui/checkbox';
import debounce from 'lodash/debounce';
import VideoSettingsTab from '@/components/admin/VideoSettingsTab';
import '@/styles/admin.css';

// Define the props type for YouTubePreview
interface YouTubePreviewProps {
  settings: {
    videoId: string;
    title: string;
    autoplay: boolean;
    muted: boolean;
    playlistId?: string;
  };
}

// Memoize child components that don't change often
const YouTubePreview = memo(({ settings }: YouTubePreviewProps) => (
  <div className="mt-6 border rounded-lg p-4">
    <h3 className="font-medium mb-2">Preview</h3>
    <div className="aspect-video w-full bg-gray-900 rounded">
      <iframe
        src={`https://www.youtube.com/embed/${settings.videoId}?rel=0&modestbranding=1&color=white&controls=1${settings.autoplay ? '&autoplay=1' : ''}${settings.muted ? '&mute=1' : ''}${settings.playlistId ? `&list=${settings.playlistId}` : ''}`}
        title={settings.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded"
      />
    </div>
  </div>
));

// Add this line to fix the display name error
YouTubePreview.displayName = 'YouTubePreview';

export default function AdminDashboard() {
  const {
    featureFlags,
    alertBanner: contextAlertBanner,
    featuredEvents,
    updateFeatureFlag,
    updateAlertBanner,
    updateFeaturedEvent,
    addFeaturedEvent,
    removeFeaturedEvent,
    youtubeSettings,
    updateYoutubeSettings,
  } = useAppContext();

  const [alertBannerState, setAlertBannerState] = useState(contextAlertBanner || {
    message: '',
    code: '',
    backgroundColor: '#E6B325',
    textColor: '#000000'
  });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Omit<FeaturedEvent, 'id'>>({
    title: '',
    date: '',
    description: '',
    imageSrc: '',
    imageAlt: '',
    bulletPoints: [],
    link: '',
    enabled: true,
    order: 0
  });
  const [newBulletPoint, setNewBulletPoint] = useState('');
  const [alertBannerErrors, setAlertBannerErrors] = useState<{
    message?: string;
    backgroundColor?: string;
    textColor?: string;
  }>({});

  const [localYoutubeSettings, setLocalYoutubeSettings] = useState<{
    videoId: string;
    title: string;
    autoplay: boolean;
    muted: boolean;
    playlistId: string | undefined;
  }>({
    videoId: '',
    title: '',
    autoplay: false,
    muted: false,
    playlistId: ''
  });

  const debouncedUpdateSettings = useMemo(
    () => debounce((newSettings) => {
      setLocalYoutubeSettings(newSettings);
    }, 300),
    [setLocalYoutubeSettings]
  );

  useEffect(() => {
    if (contextAlertBanner) {
      setAlertBannerState({
        message: contextAlertBanner.message || '',
        code: contextAlertBanner.code || '',
        backgroundColor: contextAlertBanner.backgroundColor || '#E6B325',
        textColor: contextAlertBanner.textColor || '#000000'
      });
    }
  }, [contextAlertBanner]);

  useEffect(() => {
    if (youtubeSettings) {
      setLocalYoutubeSettings({
        ...youtubeSettings,
        playlistId: youtubeSettings.playlistId || ''
      });
    }
  }, [youtubeSettings]);

  const handleAlertBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAlertBannerState(prev => ({ ...prev, [name]: value }));
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

  const saveAlertBanner = () => {
    if (validateAlertBanner()) {
      updateAlertBanner(alertBannerState);
    } else {
      toast.error("Please fix the errors before saving");
    }
  };

  const handleEventChange = (id: string, field: keyof FeaturedEvent, value: string | string[]) => {
    const event = featuredEvents.find(e => e.id === id);
    if (event) {
      updateFeaturedEvent(id, { [field]: value });
    }
  };

  const handleNewEventChange = (field: keyof Omit<FeaturedEvent, 'id'>, value: string | string[]) => {
    setNewEvent(prev => ({ ...prev, [field]: value }));
  };

  const handleAddBulletPoint = (id: string | null) => {
    if (id === null) {
      // Adding to new event
      if (newBulletPoint.trim()) {
        setNewEvent(prev => ({
          ...prev,
          bulletPoints: [...(prev.bulletPoints || []), newBulletPoint.trim()],
        }));
        setNewBulletPoint('');
      }
    } else {
      // Adding to existing event
      const event = featuredEvents.find(e => e.id === id);
      if (event && newBulletPoint.trim()) {
        updateFeaturedEvent(id, {
          ...event,
          bulletPoints: [...(event.bulletPoints || []), newBulletPoint.trim()],
        });
        setNewBulletPoint('');
      }
    }
  };

  const handleRemoveBulletPoint = (id: string | null, index: number) => {
    if (id === null) {
      // Removing from new event
      setNewEvent(prev => ({
        ...prev,
        bulletPoints: prev.bulletPoints?.filter((_, i) => i !== index) || [],
      }));
    } else {
      // Removing from existing event
      const event = featuredEvents.find(e => e.id === id);
      if (event) {
        updateFeaturedEvent(id, {
          ...event,
          bulletPoints: event.bulletPoints?.filter((_, i) => i !== index) || [],
        });
      }
    }
  };

  const handleSaveNewEvent = () => {
    if (newEvent.title && newEvent.description && newEvent.imageSrc) {
      addFeaturedEvent(newEvent);
      setNewEvent({
        title: '',
        date: '',
        description: '',
        imageSrc: '',
        imageAlt: '',
        bulletPoints: [],
        link: '',
        enabled: true,
        order: 0
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-brand-gold">Admin Dashboard</h1>
      
      <Tabs defaultValue="feature-flags" className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="mb-6 inline-flex min-w-full">
            <TabsTrigger value="feature-flags">Feature Flags</TabsTrigger>
            <TabsTrigger value="alert-banner">Alert Banner</TabsTrigger>
            <TabsTrigger value="featured-events">Featured Events</TabsTrigger>
            <TabsTrigger value="youtube-video">YouTube Video</TabsTrigger>
            <TabsTrigger value="direct-streaming">Direct Streaming</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="feature-flags">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Enable or disable features on your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showAlertBanner" className="text-lg">Alert Banner</Label>
                  <p className="text-sm text-gray-400">Show the alert banner at the top of the site</p>
                </div>
                <Switch
                  id="showAlertBanner"
                  checked={featureFlags.showAlertBanner}
                  onCheckedChange={(checked) => updateFeatureFlag('showAlertBanner', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showFeaturedEvents" className="text-lg">Featured Events</Label>
                  <p className="text-sm text-gray-400">Show featured events on the homepage</p>
                </div>
                <Switch
                  id="showFeaturedEvents"
                  checked={featureFlags.showFeaturedEvents}
                  onCheckedChange={(checked) => updateFeatureFlag('showFeaturedEvents', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showVideoPlayer" className="text-lg">Video Player</Label>
                  <p className="text-sm text-gray-400">Show the direct streaming video player on the homepage</p>
                </div>
                <Switch
                  id="showVideoPlayer"
                  checked={featureFlags.showVideoPlayer}
                  onCheckedChange={(checked) => updateFeatureFlag('showVideoPlayer', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alert-banner">
          <Card>
            <CardHeader>
              <CardTitle>Alert Banner</CardTitle>
              <CardDescription>Edit the alert banner content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="message">Message</Label>
                <Input
                  id="message"
                  name="message"
                  value={alertBannerState.message}
                  onChange={handleAlertBannerChange}
                  className={alertBannerErrors.message ? "border-red-500" : ""}
                />
                {alertBannerErrors.message && (
                  <p className="text-sm text-red-500 mt-1">{alertBannerErrors.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="code">Promo Code</Label>
                <Input
                  id="code"
                  name="code"
                  value={alertBannerState.code}
                  onChange={handleAlertBannerChange}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="backgroundColor"
                      name="backgroundColor"
                      value={alertBannerState.backgroundColor}
                      onChange={handleAlertBannerChange}
                      className={`flex-1 ${alertBannerErrors.backgroundColor ? "border-red-500" : ""}`}
                    />
                    <input
                      type="color"
                      value={alertBannerState.backgroundColor}
                      onChange={(e) => {
                        setAlertBannerState(prev => ({ ...prev, backgroundColor: e.target.value }));
                      }}
                      className="w-10 h-10 p-1 border border-gray-300 rounded cursor-pointer"
                      aria-label="Select background color"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setAlertBannerState(prev => ({ ...prev, backgroundColor: '#E6B325' }))}
                      className="text-xs hidden sm:inline-flex"
                    >
                      Reset
                    </Button>
                  </div>
                  {alertBannerErrors.backgroundColor && (
                    <p className="text-sm text-red-500 mt-1">{alertBannerErrors.backgroundColor}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="textColor"
                      name="textColor"
                      value={alertBannerState.textColor}
                      onChange={handleAlertBannerChange}
                      className={`flex-1 ${alertBannerErrors.textColor ? "border-red-500" : ""}`}
                    />
                    <input
                      type="color"
                      value={alertBannerState.textColor}
                      onChange={(e) => {
                        setAlertBannerState(prev => ({ ...prev, textColor: e.target.value }));
                      }}
                      className="w-10 h-10 p-1 border border-gray-300 rounded cursor-pointer"
                      aria-label="Select text color"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setAlertBannerState(prev => ({ ...prev, textColor: '#000000' }))}
                      className="text-xs hidden sm:inline-flex"
                    >
                      Reset
                    </Button>
                  </div>
                  {alertBannerErrors.textColor && (
                    <p className="text-sm text-red-500 mt-1">{alertBannerErrors.textColor}</p>
                  )}
                </div>
              </div>
              
              <div className="p-4 rounded" style={{ backgroundColor: alertBannerState.backgroundColor, color: alertBannerState.textColor }}>
                <p className="text-center">
                  {alertBannerState.message} {alertBannerState.code && <span className="font-bold">Use code: {alertBannerState.code}</span>}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={saveAlertBanner} 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black bg-[#E6B325] text-[#000000] shadow-md hover:bg-[#FFD966] border border-[#B38A00] focus-visible:ring-[#E6B325]/50 font-extrabold tracking-wide uppercase h-10 px-5 py-2.5"
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="featured-events">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Featured Event</CardTitle>
              <CardDescription>Create a new featured event to display on your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-title">Title</Label>
                  <Input
                    id="new-title"
                    value={newEvent.title}
                    onChange={(e) => handleNewEventChange('title', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-date">Date</Label>
                  <Input
                    id="new-date"
                    value={newEvent.date}
                    onChange={(e) => handleNewEventChange('date', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  value={newEvent.description}
                  onChange={(e) => handleNewEventChange('description', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-imageSrc">Image URL</Label>
                  <Input
                    id="new-imageSrc"
                    value={newEvent.imageSrc}
                    onChange={(e) => handleNewEventChange('imageSrc', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-imageAlt">Image Alt Text</Label>
                  <Input
                    id="new-imageAlt"
                    value={newEvent.imageAlt}
                    onChange={(e) => handleNewEventChange('imageAlt', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="new-link">Link (Optional)</Label>
                <Input
                  id="new-link"
                  value={newEvent.link || ''}
                  onChange={(e) => handleNewEventChange('link', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Bullet Points</Label>
                <div className="space-y-2 mt-2">
                  {newEvent.bulletPoints?.map((point, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input value={point} disabled />
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveBulletPoint(null, index)}
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
                      onClick={() => handleAddBulletPoint(null)}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNewEvent}>Add Event</Button>
            </CardFooter>
          </Card>
          
          <h3 className="text-xl font-bold mb-4">Existing Featured Events</h3>
          
          {featuredEvents.map((event) => (
            <Card key={event.id} className="mb-4">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>{event.date}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingEventId(editingEventId === event.id ? null : event.id)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeFeaturedEvent(event.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {editingEventId === event.id && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`title-${event.id}`}>Title</Label>
                      <Input
                        id={`title-${event.id}`}
                        value={event.title}
                        onChange={(e) => handleEventChange(event.id, 'title', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`date-${event.id}`}>Date</Label>
                      <Input
                        id={`date-${event.id}`}
                        value={event.date}
                        onChange={(e) => handleEventChange(event.id, 'date', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`description-${event.id}`}>Description</Label>
                    <Textarea
                      id={`description-${event.id}`}
                      value={event.description}
                      onChange={(e) => handleEventChange(event.id, 'description', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`imageSrc-${event.id}`}>Image URL</Label>
                      <Input
                        id={`imageSrc-${event.id}`}
                        value={event.imageSrc}
                        onChange={(e) => handleEventChange(event.id, 'imageSrc', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`imageAlt-${event.id}`}>Image Alt Text</Label>
                      <Input
                        id={`imageAlt-${event.id}`}
                        value={event.imageAlt}
                        onChange={(e) => handleEventChange(event.id, 'imageAlt', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`link-${event.id}`}>Link (Optional)</Label>
                    <Input
                      id={`link-${event.id}`}
                      value={event.link || ''}
                      onChange={(e) => handleEventChange(event.id, 'link', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label>Bullet Points</Label>
                    <div className="space-y-2 mt-2">
                      {event.bulletPoints?.map((point, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={point}
                            onChange={(e) => {
                              const newBulletPoints = [...(event.bulletPoints || [])];
                              newBulletPoints[index] = e.target.value;
                              handleEventChange(event.id, 'bulletPoints', newBulletPoints);
                            }}
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoveBulletPoint(event.id, index)}
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
                          onClick={() => handleAddBulletPoint(event.id)}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
              
              {editingEventId !== event.id && (
                <CardContent>
                  <div className="relative w-full h-40">
                    <Image
                      src={event.imageSrc}
                      alt={event.imageAlt}
                      fill
                      className="object-contain rounded"
                    />
                  </div>
                  <div>
                    <p className="text-sm mb-2">{event.description}</p>
                    {event.bulletPoints && event.bulletPoints.length > 0 && (
                      <ul className="list-disc list-inside text-sm">
                        {event.bulletPoints.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
          
          {featuredEvents.length === 0 && (
            <p className="text-gray-400">No featured events yet. Add one above!</p>
          )}
        </TabsContent>
        
        <TabsContent value="youtube-video">
          <Card>
            <CardHeader>
              <CardTitle>YouTube Video Settings</CardTitle>
              <CardDescription>Configure the featured YouTube video on your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showYouTubeVideo" className="text-lg">Show YouTube Video</Label>
                  <p className="text-sm text-gray-400">Display the featured YouTube video on the homepage</p>
                </div>
                <Switch
                  id="showYouTubeVideo"
                  checked={featureFlags.showYouTubeVideo}
                  onCheckedChange={(checked) => updateFeatureFlag('showYouTubeVideo', checked)}
                />
              </div>
              
              <div>
                <Label htmlFor="videoId">YouTube Video ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="videoId"
                    value={localYoutubeSettings.videoId}
                    onChange={(e) => debouncedUpdateSettings({...localYoutubeSettings, videoId: e.target.value})}
                    placeholder="e.g. V8D_ELNVRko"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline"
                    onClick={() => {
                      window.open(`https://www.youtube.com/watch?v=${localYoutubeSettings.videoId}`, '_blank');
                    }}
                  >
                    Preview
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  The ID is the part after &quot;v=&quot; in a YouTube URL
                </p>
              </div>
              
              <div>
                <Label htmlFor="videoTitle">Video Title</Label>
                <Input
                  id="videoTitle"
                  value={localYoutubeSettings.title}
                  onChange={(e) => setLocalYoutubeSettings({...localYoutubeSettings, title: e.target.value})}
                  placeholder="Featured Video"
                />
              </div>
              
              <div>
                <Label htmlFor="playlistId">Playlist ID (Optional)</Label>
                <Input
                  id="playlistId"
                  value={localYoutubeSettings.playlistId || ''}
                  onChange={(e) => setLocalYoutubeSettings({...localYoutubeSettings, playlistId: e.target.value})}
                  placeholder="Leave empty for single video"
                />
              </div>
              
              <div className="flex space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="autoplay" 
                    checked={localYoutubeSettings.autoplay}
                    onCheckedChange={(checked) => 
                      setLocalYoutubeSettings({...localYoutubeSettings, autoplay: checked === true})
                    }
                  />
                  <Label htmlFor="autoplay">Autoplay</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="muted" 
                    checked={localYoutubeSettings.muted}
                    onCheckedChange={(checked) => 
                      setLocalYoutubeSettings({...localYoutubeSettings, muted: checked === true})
                    }
                  />
                  <Label htmlFor="muted">Muted</Label>
                </div>
              </div>
              
              <p className="text-xs text-amber-500 mt-2">
                Note: Most browsers require videos to be muted when autoplay is enabled.
              </p>
              
              <YouTubePreview settings={localYoutubeSettings} />
            </CardContent>
            <CardFooter>
              <Button 
                onClick={async () => {
                  try {
                    await updateYoutubeSettings(localYoutubeSettings);
                    toast.success("YouTube settings saved");
                  } catch (error: Error | unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    toast.error(`Failed to save YouTube settings: ${errorMessage}`);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black bg-[#E6B325] text-[#000000] shadow-md hover:bg-[#FFD966] border border-[#B38A00] focus-visible:ring-[#E6B325]/50 font-extrabold tracking-wide uppercase h-10 px-5 py-2.5"
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="direct-streaming">
          <VideoSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
} 