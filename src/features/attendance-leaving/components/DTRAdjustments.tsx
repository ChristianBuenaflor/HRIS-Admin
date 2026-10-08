// components/DTRAdjustments.tsx
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
  CheckCircle,
  XCircle,
  FileText,
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
  attendance_id: number;
  employee_id: number;

  date: string | null;
  original_clock_in: string | null;
  original_clock_out: string | null;
  adjusted_clock_in: string | null;
  adjusted_clock_out: string | null;

  reason: string | null;
  status: string;

  reviewed_by: number | null;
  reviewed_at: string | null;

  clock_in_image: string | null;
  clock_out_image: string | null;

  created_at: string;
  updated_at: string;

  employee: Employee;
}

interface AdjustmentsResponse {
  isSuccess: boolean;
  data: AdjustmentRecord[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

const DTRAdjustments = () => {
  const [adjustments, setAdjustments] = useState<AdjustmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Fetch adjustments data from API
  const fetchAdjustments = async (overrides?: { search?: string; status?: string; page?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const effectiveSearch = overrides?.search !== undefined ? overrides.search : searchTerm;
      const effectiveStatus = overrides?.status !== undefined ? overrides.status : statusFilter;
      const effectivePage = overrides?.page !== undefined ? overrides.page : currentPage;
      const params = new URLSearchParams();
      if (effectiveStatus && effectiveStatus !== "all") params.append("status", effectiveStatus);
      if (effectiveSearch) params.append("search", effectiveSearch);
      params.append("page", String(effectivePage));

      const response = await fetch(
        `${API_BASE_URL}/dtr-adjustments?${params}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch adjustments");
      }

      const data: AdjustmentsResponse = await response.json();

      if (data.isSuccess) {
        setAdjustments(data.data || []);
        setTotalRecords(data.pagination?.total || 0);
        setCurrentPage(data.pagination?.current_page ?? effectivePage);
        setLastPage(data.pagination?.last_page ?? 1);
      } else {
        setError("Failed to fetch adjustments data");
      }
    } catch (err) {
      console.error("Error fetching adjustments:", err);
      setError("Failed to fetch adjustments data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const handleApprove = async (adjustmentId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/adjustment/approve/${adjustmentId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "approved" }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to approve adjustment");
      }

      // Refresh the list after approval
      fetchAdjustments();
    } catch (err) {
      console.error("Error approving adjustment:", err);
      setError("Failed to approve adjustment");
    }
  };

  const handleReject = async (adjustmentId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/adjustment/reject/${adjustmentId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to reject adjustment");
      }

      // Refresh the list after rejection
      fetchAdjustments();
    } catch (err) {
      console.error("Error rejecting adjustment:", err);
      setError("Failed to reject adjustment");
    }
  };

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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const getEmployeeName = (employee: Employee) => {
    return `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim();
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "--";
    try {
      return format(new Date(timeString), "hh:mm a");
    } catch (error) {
      return "--";
    }
  };

 const formatDate = (dateString: string | null) => {
  if (!dateString) return "--"; // handle null
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch (error) {
    return "Invalid Date";
  }
};

 const getAdjustmentDate = (record: AdjustmentRecord) => {
  if (record.date) return formatDate(record.date);
  if (record.original_clock_in) return formatDate(record.original_clock_in);
  if (record.adjusted_clock_out) return formatDate(record.adjusted_clock_out);
  return "--";
};

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchAdjustments({ page: 1 });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setCurrentPage(1);
    fetchAdjustments({ search: "", status: "", page: 1 });
  };

  const truncateText = (text: string, limit = 40) => {
    if (!text) return "--";
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading adjustments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => fetchAdjustments()} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-2 block">
                Search Employees
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium mb-2 block">
                Filter by Status
              </label>
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
          </div>
        </CardContent>
      </Card>

      {/* Adjustments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>DTR Adjustment Requests</CardTitle>
              <CardDescription>
                Review and approve attendance time adjustment requests
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAdjustments()}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {adjustments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Adjustment Requests Found
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm || statusFilter
                  ? "No adjustment requests match your current filters. Try adjusting your search criteria."
                  : "There are no DTR adjustment requests pending review at this time."}
              </p>
              {(searchTerm || statusFilter) && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {adjustments.length} of {totalRecords} adjustment
                requests
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Original Time</TableHead>
                      <TableHead>Adjusted Time</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>                  <TableBody>
                    {adjustments.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            {record.employee.profile_picture ? (
                              <AvatarImage
                                src={record.employee.profile_picture}
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
                              {getEmployeeName(record.employee)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getAdjustmentDate(record)}</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="font-medium">In:</span>{" "}
                              {formatTime(record.original_clock_in)}
                            </div>
                            <div>
                              <span className="font-medium">Out:</span>{" "}
                              {formatTime(record.original_clock_out)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">In:</span>
                              {formatTime(record.adjusted_clock_in)}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Out:</span>
                              {formatTime(record.adjusted_clock_out)}
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
                          <div className="flex space-x-2">
                            {record.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApprove(record.id)}
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReject(record.id)}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {record.status !== "pending" && (
                              <span className="text-sm text-muted-foreground italic">
                                Processed
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {lastPage > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => fetchAdjustments({ page: currentPage - 1 })}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {lastPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === lastPage}
                    onClick={() => fetchAdjustments({ page: currentPage + 1 })}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DTRAdjustments;
