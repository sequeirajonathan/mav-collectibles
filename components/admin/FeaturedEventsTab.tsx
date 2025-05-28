"use client";

import { useState } from "react";
import { useAppContext } from "@contexts/AppContext";
import type { FeaturedEvent as FeaturedEventType } from "@interfaces";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import EventForm from "./EventForm";
import FeaturedEvent from "@components/ui/FeaturedEvent";
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
  
  const handleAddEvent = async (event: Partial<FeaturedEventType>) => {
    try {
      // Ensure all required fields are present
      if (!event.title || !event.description || !event.imageSrc) {
        toast.error("Missing required fields");
        return;
      }
      // Validate and format date
      let formattedDate = "";
      if (event.date) {
        let dateObj: Date | null = null;
        if (event.date.includes("T")) {
          // ISO string
          dateObj = new Date(event.date);
        } else if (event.date.includes("/")) {
          // MM/DD/YYYY fallback
          const [month, day, year] = event.date.split('/');
          dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        if (dateObj && !isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString();
        } else {
          toast.error("Please select a valid date and time.");
          return;
        }
      } else {
        toast.error("Please select a date and time.");
        return;
      }
      // Create a complete event object with defaults for optional fields
      const completeEvent: Omit<FeaturedEventType, "id" | "createdAt" | "updatedAt"> = {
        title: event.title,
        description: event.description,
        imageSrc: event.imageSrc,
        date: formattedDate,
        imageAlt: event.imageAlt || "",
        link: event.link || `${process.env.NEXT_PUBLIC_SITE_URL}/events`,
        enabled: event.enabled !== undefined ? event.enabled : true,
        order: 1 // Set a default order of 1 to satisfy the validation
      };
      await addFeaturedEvent(completeEvent);
      setShowNewEventForm(false);
      toast.success("New event added successfully!");
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error("Failed to add event. Please try again.");
    }
  };
  
  const handleUpdateEvent = async (id: string, event: Partial<FeaturedEventType>) => {
    try {
      // Format date to ISO string if it exists
      let formattedDate = event.date;
      if (event.date && event.date.includes('/')) {
        const [month, day, year] = event.date.split('/');
        formattedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
      }

      const updatedEvent = {
        ...event,
        date: formattedDate,
        order: event.order || 1 // Ensure order is at least 1
      };

      await updateFeaturedEvent(id, updatedEvent);
      setEditingEventId(null);
      toast.success("Event updated successfully!");
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error("Failed to update event. Please try again.");
    }
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
                <FeaturedEvent {...event} />
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
} 