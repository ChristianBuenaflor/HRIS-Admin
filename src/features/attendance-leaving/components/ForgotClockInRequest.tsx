// components/ForgotClockInRequest.tsx
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  RefreshCw,
  Search,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
const API_BASE_URL = "https://api-hris.slarenasitsolutions.com/public/api";  

const getToken = () => localStorage.getItem("token") ?? "";

interface Employee {
  id: number;
  profile_picture: string | null;
  first_name: string;
  last_name: string;
  employee_id: string;
}

interface AdjustmentRecord {
  id: number;
  requested_clock_date: string;
  requested_clock_in: string | null;
  requested_clock_out: string | null;
  reason: string | null;
  status: string;
  created_at: string;
  employee: Employee;
}

const ForgotClockInRequest = () => {
  const [adjustments, setAdjustments] = useState<AdjustmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchAdjustments = async (overrides?: { search?: string; status?: string }) => {
    setLoading(true);
    try {
      const effectiveSearch = overrides?.search !== undefined ? overrides.search : searchTerm;
      const effectiveStatus = overrides?.status !== undefined ? overrides.status : statusFilter;
      const params = new URLSearchParams();

      if (effectiveStatus && effectiveStatus !== "all") {
        params.append("status", effectiveStatus);
      }

      if (effectiveSearch) {
        params.append("search", effectiveSearch);
      }

      const response = await fetch(
        `${API_BASE_URL}/missed-adjustments?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      

      if (result.isSuccess) {
        setAdjustments(result.data || []);
      } else {
        setAdjustments([]);
      }
    } catch (err) {
      console.error("Error fetching adjustments:", err);
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employee: Employee) => {
    return `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim();
  };

  const handleApprove = async (id: number) => {
    try {
      setProcessingId(id);
      const response = await fetch(`${API_BASE_URL}/adjustment/approve/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "approved",
        }),
      });

      await response.json();

      fetchAdjustments();
    } catch (err) {
      console.error("Approve failed", err);
    } finally {
      setProcessingId(null);
    }
  };
  const handleReject = async (id: number) => {
    try {
      setProcessingId(id);
      const response = await fetch(`${API_BASE_URL}/adjustment/reject/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });

      await response.json();

      fetchAdjustments();
      setProcessingId(null);
    } catch (err) {
      console.error("Reject failed", err);
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const formatTime = (time: string | null) => {
    if (!time) return "--";
    return format(new Date(time), "hh:mm a");
  };

  const formatDate = (date: string) => format(new Date(date), "MMM dd, yyyy");

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleApplyFilters = () => fetchAdjustments();
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    fetchAdjustments({ search: "", status: "" });
  };

  const truncateText = (text: string, limit = 40) => {
    if (!text) return "--";
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employee name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={handleApplyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!searchTerm && !statusFilter}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Adjustments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Forgot Clock-In Requests</CardTitle>
          <CardDescription>
            Review missed clock-in adjustment requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 flex justify-center items-center">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : adjustments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Requests Found</h3>
              <p className="text-muted-foreground">
                There are no missed clock-in requests at this time.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Adjusted Time</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        {record.employee.profile_picture ? (
                          <AvatarImage
                            src={
                              record.employee.profile_picture ||
                              `${API_BASE_URL}/api/profile-picture?name=${getEmployeeName(record.employee)}`
                            }
                            alt={getEmployeeName(record.employee)}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <AvatarFallback>
                            {getInitials(
                              record.employee.first_name,
                              record.employee.last_name,
                            )}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {record.employee.first_name}{" "}
                          {record.employee.last_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(record.requested_clock_date)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">In:</span>{" "}
                          {formatTime(record.requested_clock_in)}
                        </div>
                        <div>
                          <span className="font-medium">Out:</span>{" "}
                          {formatTime(record.requested_clock_out)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.reason ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-pointer">
                                {truncateText(record.reason)}
                              </span>
                            </TooltipTrigger>

                            <TooltipContent className="max-w-xs">
                              {record.reason}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        "--"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(record.status)}>
                        {record.status || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {record.status === "pending" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={processingId === record.id}
                                onClick={() => handleApprove(record.id)}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={processingId === record.id}
                                onClick={() => handleReject(record.id)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">
                              Processed
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotClockInRequest;
