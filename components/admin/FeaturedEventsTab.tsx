"use client";

import { useState } from "react";
import { useAppContext } from "@contexts/AppContext";
import { type FeaturedEvent } from "@interfaces";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import EventForm from "./EventForm";
import Image from "next/image";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function FeaturedEventsTab() {
  const { 
    featuredEvents, 
    addFeaturedEvent, 
    updateFeaturedEvent, 
    removeFeaturedEvent 
  } = useAppContext();
  
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  
  const handleAddEvent = (event: Partial<FeaturedEvent>) => {
    // Ensure all required fields are present
    if (!event.title || !event.description || !event.imageSrc) {
      toast.error("Missing required fields");
      return;
    }
    
    // Create a complete event object with defaults for optional fields
    const completeEvent: Omit<FeaturedEvent, "id" | "createdAt" | "updatedAt"> = {
      title: event.title,
      description: event.description,
      imageSrc: event.imageSrc,
      date: event.date || "",
      imageAlt: event.imageAlt || "",
      bulletPoints: event.bulletPoints || [],
      link: event.link || "",
      enabled: event.enabled !== undefined ? event.enabled : true,
      order: event.order || 0
    };
    
    addFeaturedEvent(completeEvent);
    setShowNewEventForm(false);
    toast.success("New event added successfully!");
  };
  
  const handleUpdateEvent = (id: string, event: Partial<FeaturedEvent>) => {
    updateFeaturedEvent(id, event);
    setEditingEventId(null);
    toast.success("Event updated successfully!");
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Featured Event</CardTitle>
          <CardDescription>Create a new featured event to display on your site</CardDescription>
        </CardHeader>
        <CardContent>
          {showNewEventForm ? (
            <EventForm 
              event={{
                title: '',
                date: '',
                description: '',
                imageSrc: '',
                imageAlt: '',
                bulletPoints: [],
                link: '',
                enabled: true,
                order: 0
              }}
              onSave={handleAddEvent}
              onCancel={() => setShowNewEventForm(false)}
              buttonText="Add Event"
            />
          ) : (
            <Button 
              onClick={() => setShowNewEventForm(true)}
              variant="gold"
            >
              Create New Event
            </Button>
          )}
        </CardContent>
      </Card>
      
      <h3 className="text-xl font-bold mb-4">Existing Featured Events</h3>
      
      {!featuredEvents || featuredEvents.length === 0 ? (
        <p className="text-gray-400">No featured events yet. Add one above!</p>
      ) : (
        featuredEvents.map((event) => (
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
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this event?")) {
                        removeFeaturedEvent(event.id);
                        toast.success("Event removed successfully");
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {editingEventId === event.id ? (
              <CardContent>
                <EventForm 
                  event={event}
                  onSave={(updatedEvent) => handleUpdateEvent(event.id, updatedEvent)}
                  onCancel={() => setEditingEventId(null)}
                  buttonText="Save Changes"
                />
              </CardContent>
            ) : (
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
        ))
      )}
    </div>
  );
} 