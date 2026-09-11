import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Megaphone,
  Search,
  Plus,
  MessageSquare,
  Calendar,
  User,
  Loader2,
  Pencil,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/utils/axios";

// Types
interface Announcement {
  id: number;
  title: string;
  content: string;
  publish_at: string | null;
  expire_at: string | null;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
  // Frontend computed fields
  type: "urgent" | "important" | "general" | "event";
  priority: "high" | "medium" | "low";
  description: string;
}

interface AnnouncementFormData {
  title: string;
  content: string;
  publish_at: string;
  expire_at: string;
}

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, FontSize],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[180px] w-full bg-white px-4 py-3 text-[15px] leading-7 text-slate-700 focus:outline-none",
        "data-placeholder": "Description",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const html = editor.getHTML();
    if (value !== html) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-300 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 border-b border-slate-300 bg-white px-3 py-2">
        <select
          aria-label="Font size"
          value={editor.getAttributes("textStyle").fontSize ?? ""}
          onChange={(event) => {
            const fontSize = event.target.value;
            const chain = editor.chain().focus();

            if (fontSize) {
              chain.setFontSize(fontSize).run();
            } else {
              chain.unsetFontSize().run();
            }
          }}
          className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none transition focus:border-slate-500"
        >
          <option value="">Size</option>
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="24px">24</option>
          <option value="32px">32</option>
        </select>
       
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={
            editor.isActive("bold")
              ? "flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-lg font-bold text-white"
              : "flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-slate-700 transition hover:bg-slate-100"
          }
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={
            editor.isActive("italic")
              ? "flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-lg italic text-white"
              : "flex h-8 w-8 items-center justify-center rounded-full text-lg italic text-slate-700 transition hover:bg-slate-100"
          }
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={
            editor.isActive("underline")
              ? "flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-lg font-medium text-white underline"
              : "flex h-8 w-8 items-center justify-center rounded-full text-lg font-medium text-slate-700 transition hover:bg-slate-100 underline"
          }
        >
          U
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={
            editor.isActive("bulletList")
              ? "flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-lg text-white"
              : "flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-700 transition hover:bg-slate-100"
          }
        >
          ≡
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={
            editor.isActive("orderedList")
              ? "flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-lg text-white"
              : "flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-700 transition hover:bg-slate-100"
          }
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={
            editor.isActive("blockquote")
              ? "flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-lg text-white"
              : "flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-700 transition hover:bg-slate-100"
          }
        >
          “
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={
            editor.isActive("codeBlock")
              ? "flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white"
              : "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          }
        >
          &lt;/&gt;
        </button>
        <button
          type="button"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-600 transition hover:bg-slate-100"
        >
          🔗
        </button>
      </div>
      <div className="bg-white text-slate-700">
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:overflow-y-auto [&_.ProseMirror]:max-h-[500px] [&_.ProseMirror]:min-h-[160px] [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-3 [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-[15px] [&_.ProseMirror]:leading-7 [&_.ProseMirror]:text-slate-700 [&_.ProseMirror]:empty:before:content-[attr(data-placeholder)] [&_.ProseMirror]:empty:before:text-slate-400 [&_.ProseMirror]:empty:before:font-medium [&_.ProseMirror]:empty:before:text-[15px] [&_.ProseMirror_p]:my-0 [&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ol]:my-2 [&_.ProseMirror_li]:my-1 [&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_em]:italic [&_.ProseMirror_u]:underline"
        />
      </div>
    </div>
  );
};

const Announcement = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const { user } = useAuth();

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: "",
    content: "",
    publish_at: "",
    expire_at: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/announcements");
      const result = response.data;
      if (result.isSuccess) {
        const mapped = result.data.map((item: any) => ({
          ...item,
          type: item.title.toLowerCase().includes("urgent")
            ? "urgent"
            : item.title.toLowerCase().includes("important")
              ? "important"
              : item.title.toLowerCase().includes("event")
                ? "event"
                : "general",
          priority: item.is_active ? "high" : "medium",
          description: `${stripHtml(item.content || "").slice(0, 100)}${stripHtml(item.content || "").length > 100 ? "..." : ""
            }`,
        }));
        setAnnouncements(mapped);
      } else {
        setError("Failed to load announcements");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const plainContent = stripHtml(formData.content);
    if (!plainContent) {
      toast.error("Announcement content is required.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const response = await api.post("/create/announcements", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = response.data;

      if (result.isSuccess) {
        toast.success("Announcement created successfully");
        setIsCreateOpen(false);
        resetForm();
        fetchAnnouncements();
      } else {
        toast.error(result.message || "Failed to create announcement");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Network error. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnnouncement) return;

    const plainContent = stripHtml(formData.content);
    if (!plainContent) {
      toast.error("Announcement content is required.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(
        `/update/announcements/${selectedAnnouncement.id}`,
        formData,
      );
      const result = response.data;
      if (result.isSuccess) {
        toast.success("Announcement updated successfully");
        setIsEditOpen(false);
        setIsDetailOpen(false);
        fetchAnnouncements();
      } else {
        toast.error(result.message || "Failed to update announcement");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Network error. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      const response = await api.post(`/announcements/${id}/archive`);
      const result = response.data;
      if (result.isSuccess) {
        toast.success("Announcement archived");
        setIsDetailOpen(false);
        fetchAnnouncements();
      } else {
        toast.error(result.message || "Failed to archive announcement");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Network error. Please try again.",
      );
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      publish_at: "",
      expire_at: "",
    });
  };

  const openEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      publish_at: announcement.publish_at || "",
      expire_at: announcement.expire_at || "",
    });
    setIsEditOpen(true);
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || a.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-100 text-red-800 hover:bg-red-100",
      important: "bg-orange-100 text-orange-800 hover:bg-orange-100",
      event: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      general: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    };
    return colors[type] || colors.general;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "high") {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="p-6">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchAnnouncements} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Announcements</h1>
          </div>
          <p className="text-slate-600">
            Stay updated with the latest company announcements and news
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 h-10"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Announcement
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {["all", "urgent", "important", "event", "general"].map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type)}
              className={
                selectedType === type ? "bg-blue-600 hover:bg-blue-700" : ""
              }
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>

        {/* Announcements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((announcement) => (
              <Card
                key={announcement.id}
                className="hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-300"
                onClick={() => {
                  setSelectedAnnouncement(announcement);
                  setIsDetailOpen(true);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTypeColor(announcement.type)}>
                          {announcement.type.charAt(0).toUpperCase() +
                            announcement.type.slice(1)}
                        </Badge>
                        {getPriorityIcon(announcement.priority)}
                      </div>
                      <CardTitle className="text-xl text-slate-900">
                        {announcement.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-700 mb-4">
                    {announcement.description}
                  </CardDescription>
                  <div className="flex items-center justify-between text-sm text-slate-500 border-t pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>
                          {announcement.user?.first_name ?? "Unknown"}{" "}
                          {announcement.user?.last_name ?? ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(announcement.created_at)}</span>
                      </div>
                    </div>
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Megaphone className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-slate-600 text-lg font-medium">
                    No announcements found
                  </p>
                  <p className="text-slate-500 text-sm">
                    Try adjusting your search or filters
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl w-[min(90vw,42rem)] max-h-[80vh] overflow-hidden p-0">
          {selectedAnnouncement && (
            <ScrollArea className="h-[80vh] w-full">
              <div className="p-6">
                <DialogHeader className="mb-6 pr-8">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge
                          className={getTypeColor(selectedAnnouncement.type)}
                        >
                          {selectedAnnouncement.type.charAt(0).toUpperCase() +
                            selectedAnnouncement.type.slice(1)}
                        </Badge>
                        {getPriorityIcon(selectedAnnouncement.priority)}
                      </div>
                      <DialogTitle className="text-2xl text-slate-900">
                        {selectedAnnouncement.title}
                      </DialogTitle>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Author and Date */}
                  <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-4 rounded-lg gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {selectedAnnouncement.user?.first_name ?? "Unknown"}{" "}
                        {selectedAnnouncement.user?.last_name ?? ""}
                      </p>
                      <p className="text-slate-500">Posted</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-600">
                        {formatDate(selectedAnnouncement.created_at)}
                      </p>
                      {selectedAnnouncement.publish_at && (
                        <p className="text-xs text-slate-400">
                          Publishes:{" "}
                          {formatDate(selectedAnnouncement.publish_at)}
                        </p>
                      )}
                      {selectedAnnouncement.expire_at && (
                        <p className="text-xs text-slate-400">
                          Expires: {formatDate(selectedAnnouncement.expire_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-3">
                      Details
                    </h3>
                    <div
                      className="text-slate-700 leading-relaxed break-words [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:font-semibold [&_em]:italic"
                      dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 border-t pt-6">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEdit(selectedAnnouncement)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleArchive(selectedAnnouncement.id)}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) =>
                  setFormData({ ...formData, content })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  Publish At (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={formData.publish_at}
                  onChange={(e) =>
                    setFormData({ ...formData, publish_at: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Expire At (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={formData.expire_at}
                  onChange={(e) =>
                    setFormData({ ...formData, expire_at: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) =>
                  setFormData({ ...formData, content })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  Publish At (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={formData.publish_at}
                  onChange={(e) =>
                    setFormData({ ...formData, publish_at: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Expire At (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={formData.expire_at}
                  onChange={(e) =>
                    setFormData({ ...formData, expire_at: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Announcement;
