"use client";

import { useState } from "react";
import type { FeaturedEvent as FeaturedEventType } from "@interfaces";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import EventForm from "./EventForm";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useFeaturedEvents, useCreateFeaturedEvent, useUpdateFeaturedEvent, useDeleteFeaturedEvent } from "@hooks/useFeaturedEvents";
import Image from "next/image";

export default function FeaturedEventsTab() {
  const { data: featuredEvents = [], isLoading, error } = useFeaturedEvents();
  const { mutate: createEvent } = useCreateFeaturedEvent();
  const { mutate: updateEvent } = useUpdateFeaturedEvent();
  const { mutate: deleteEvent } = useDeleteFeaturedEvent();
  
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
        link: event.link || "/events",
        enabled: event.enabled !== undefined ? event.enabled : true,
        order: 1 // Set a default order of 1 to satisfy the validation
      };
      await createEvent(completeEvent);
      setShowNewEventForm(false);
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
        order: event.order || 1, // Ensure order is at least 1
        enabled: event.enabled !== undefined ? event.enabled : true // Ensure enabled is properly set
      };

      await updateEvent({ id, data: updatedEvent });
      toast.success('Event updated successfully');
      setEditingEventId(null);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update event. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">Failed to load featured events</p>
      </div>
    );
  }
  
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
          <Card key={event.id} className="mb-2 rounded-lg bg-[#151a24] border border-[#22283a] shadow-none">
            <div className="flex flex-row items-center px-3 py-2 gap-3">
              {/* Image */}
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-16 relative">
                <Image 
                  src={event.imageSrc} 
                  alt={event.imageAlt} 
                  fill
                  className="object-contain rounded"
                  sizes="48px"
                />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#E6B325] text-base truncate">{event.title}</span>
                  <span className="text-xs text-[#FFD966] ml-2 whitespace-nowrap">{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <span className="text-xs text-gray-400 truncate">{event.description}</span>
                <span className="text-xs text-gray-500 mt-1">{event.date && `Starts @ ${new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} CST`}</span>
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-2 ml-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 p-0"
                  onClick={() => setEditingEventId(editingEventId === event.id ? null : event.id)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this event?")) {
                      deleteEvent(event.id);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            {editingEventId === event.id && (
              <div className="px-3 pb-3">
                <EventForm
                  event={event}
                  onSave={(updatedEvent) => handleUpdateEvent(event.id, updatedEvent)}
                  onCancel={() => setEditingEventId(null)}
                  buttonText="Save Changes"
                />
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
} 