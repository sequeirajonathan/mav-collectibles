import { useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { useUserRoles } from "@hooks/useUserRoles";
import { UserRole } from "@interfaces/roles";

export default function RolesTab() {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { updateUserRole, isLoading } = useUserRoles();

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    try {
      const response = await updateUserRole(userId, role);
      if (response && response.success) {
        setStatus({
          type: "success",
          message: `Role updated: ${response.username} is now ${response.role}`,
        });
        setUserId("");
        setRole(UserRole.USER);
      } else {
        throw new Error("Failed to update role");
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-black border border-[#E6B325]/30 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-[#E6B325] mb-4">User Role Management</h2>
        
        <form onSubmit={handleUpdateRole} className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              required
              className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.USER}>User</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                <SelectItem value={UserRole.EVENT}>Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            variant="gold" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Role"}
          </Button>

          {status && (
            <div
              className={`p-4 rounded ${
                status.type === "success" ? "bg-green-500" : "bg-red-500"
              } text-white`}
            >
              {status.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 