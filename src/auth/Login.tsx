import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Settings, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { CandidatePortal } from '@/client/CandidatePortal'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import api from '@/utils/axios'
import { hydrateStoredRole } from '@/utils/hydrateRole'

const base = import.meta.env.BASE_URL || "/";

const StartupLoading = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center z-50"
        >
            <div className="text-center space-y-8">
                {/* Main Brand Animation */}
                <div className="relative">
                    {/* Pulse Effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-xl opacity-20"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Logo Container */}
                    <motion.div
                        className="relative w-24 h-24 mx-auto mb-8"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{
                            scale: 1,
                            rotate: 0,
                            transition: {
                                type: "spring",
                                stiffness: 100,
                                damping: 15,
                                duration: 1.5
                            }
                        }}
                    >
                        {/* Main Logo */}
                        <motion.div
                            className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl"
                            animate={{
                                rotateY: [0, 180, 360],
                                boxShadow: [
                                    "0 0 0px rgba(99, 102, 241, 0.5)",
                                    "0 0 30px rgba(99, 102, 241, 0.8)",
                                    "0 0 0px rgba(99, 102, 241, 0.5)"
                                ]
                            }}
                            transition={{
                                rotateY: {
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "linear"
                                },
                                boxShadow: {
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }
                            }}
                        >
                            <motion.div
                                className="text-white flex items-center justify-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <img src={`${base}logo.png`} alt="" />
                            </motion.div>
                        </motion.div>

                        {/* Floating Orbs */}
                        {[...Array(4)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-3 h-3 bg-cyan-400 rounded-full"
                                initial={{
                                    x: 0,
                                    y: 0,
                                    scale: 0,
                                }}
                                animate={{
                                    x: Math.cos((i / 4) * Math.PI * 2) * 40,
                                    y: Math.sin((i / 4) * Math.PI * 2) * 40,
                                    scale: [0, 1, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.3,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </motion.div>
                </div>

                {/* Text Content */}
                <div className="space-y-6">
                    <div>
                        <motion.h1
                            className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            SNL System
                        </motion.h1>
                        <motion.p
                            className="text-gray-300 mt-2 text-lg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            Human Resources Information System
                        </motion.p>
                    </div>

                    {/* Animated Progress */}
                    <div className="space-y-4">
                        <div className="w-80 mx-auto bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{
                                    duration: 2,
                                    ease: "easeInOut"
                                }}
                            />
                        </div>

                        {/* Loading States */}
                        <motion.div
                            className="text-sm text-gray-400 space-y-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <motion.p
                                animate={{
                                    opacity: [0.5, 1, 0.5],
                                    transition: {
                                        duration: 1.5,
                                        repeat: Infinity,
                                        repeatType: "reverse"
                                    }
                                }}
                            >
                                Loading candidate portal...
                            </motion.p>
                            <motion.p
                                animate={{
                                    opacity: [0.5, 1, 0.5],
                                    transition: {
                                        duration: 1.5,
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                        delay: 0.5
                                    }
                                }}
                            >
                                Initializing system modules...
                            </motion.p>
                            <motion.p
                                animate={{
                                    opacity: [0.5, 1, 0.5],
                                    transition: {
                                        duration: 1.5,
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                        delay: 1
                                    }
                                }}
                            >
                                Preparing your dashboard...
                            </motion.p>
                        </motion.div>
                    </div>

                    {/* Tech Stack Indicators */}
                    <motion.div
                        className="flex justify-center space-x-6 text-xs text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                        >
                            React
                        </motion.span>
                        <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                        >
                            TypeScript
                        </motion.span>
                        <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                        >
                            Framer Motion
                        </motion.span>
                        <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                        >
                            Tailwind CSS
                        </motion.span>
                    </motion.div>
                </div>

                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
                            initial={{
                                x: Math.random() * window.innerWidth,
                                y: Math.random() * window.innerHeight,
                                scale: 0,
                            }}
                            animate={{
                                scale: [0, 1, 0],
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

const Login = () => {
    const navigate = useNavigate();
    const [showLogin, setShowLogin] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showIcon, setShowIcon] = useState(false)
    const [hovered, setHovered] = useState(false)
    const [showStartup, setShowStartup] = useState(true)

    useEffect(() => {
        // Show startup animation for 3 seconds minimum
        const startupTimer = setTimeout(() => {
            setShowStartup(false)
        }, 3000)

        return () => clearTimeout(startupTimer)
    }, [])

    useEffect(() => {
        if (showStartup) return;

        const handleScroll = () => setShowIcon(window.scrollY > 50)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "F12") setShowLogin(true)
        }
        window.addEventListener('scroll', handleScroll)
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [showStartup])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await api.post("/login", {
                login: email,
                password,
            })

            if (res.data.isSuccess) {
                toast.success(res.data.message)

                localStorage.setItem("token", res.data.token)
                localStorage.setItem("user", JSON.stringify(res.data.user))
                localStorage.setItem("role", res.data.role)

                // Login carries no role fields (role is the "user" guard string);
                // hydrate the real privilege from GET /users before entering.
                // Failures keep the legacy authenticated session, never block login.
                await hydrateStoredRole()

                navigate("/dashboard")
            } else {
                toast.error(res.data.message)
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Login failed")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <AnimatePresence>
                {showStartup && <StartupLoading />}
            </AnimatePresence>

            {!showStartup && !showLogin && <CandidatePortal />}

            {!showStartup && showLogin && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="min-h-screen flex"
                >
                    {/* Left Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 flex flex-col bg-white"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="p-8"
                        >
                            <div className="flex items-center gap-2">
                                <motion.div
                                    whileHover={{ rotate: 90 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"
                                >
                                    <Settings className="w-5 h-5 text-white" />
                                </motion.div>
                                <span className="text-xl font-semibold text-slate-900">SNL</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex-1 flex items-center justify-center px-8 pb-16"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="w-full max-w-md space-y-8"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    className="space-y-2"
                                >
                                    <h1 className="text-4xl font-bold text-slate-900">Welcome Back</h1>
                                    <p className="text-slate-500">Enter your email and password to access your account</p>
                                </motion.div>

                                <motion.form
                                    onSubmit={handleSubmit}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="space-y-6"
                                >
                                    <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                                        <Label htmlFor="email" className="text-slate-700">Email or Username</Label>
                                        <Input
                                            id="email"
                                            type="text"
                                            placeholder="salmaadnan@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-12 bg-slate-50 border-slate-200 focus:bg-white"
                                        />
                                    </motion.div>

                                    <motion.div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-slate-700">Password</Label>
                                            <button
                                                type="button"
                                                className="text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                Forgot Your Password?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Sellora.com"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="h-12 pr-10 bg-slate-50 border-slate-200 focus:bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </motion.div>

                                    <motion.div whileHover={{ scale: 1.03 }}>
                                        <Button
                                            type="submit"
                                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Logging in...' : 'Log in'}
                                        </Button>
                                    </motion.div>
                                </motion.form>

                                <Separator />

                                <div className="text-center">
                                    <p className="text-sm text-slate-600">
                                        Contact your system administrator if you need account assistance.
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="p-8 flex items-center justify-between text-xs text-slate-400"
                        >
                            <span>©{new Date().getFullYear()} My Company. All Rights Reserved.</span>
                            <button className="hover:text-slate-600">Privacy Policy</button>
                        </motion.div>
                    </motion.div>

                    {/* Right Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        className="hidden lg:flex flex-1 bg-indigo-600 items-center justify-center p-16 relative overflow-hidden"
                    >
                        <div className="absolute top-20 right-20 w-64 h-64 bg-indigo-500 rounded-full opacity-50 blur-3xl"></div>
                        <div className="absolute bottom-20 left-20 w-48 h-48 bg-indigo-700 rounded-full opacity-50 blur-3xl"></div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="relative z-10 max-w-xl space-y-8"
                        >
                            <motion.h2
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="text-4xl font-bold text-white leading-tight"
                            >
                                Effortlessly manage your team and operations.
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                                className="text-indigo-100 text-lg"
                            >
                                Log in to access your CRM dashboard and manage your team efficiently.
                            </motion.p>

                            <motion.img
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.1 }}
                                src={`${base}samplebg.png`}
                                alt="Dashboard Preview"
                                className="relative rounded-2xl shadow-2xl w-full"
                            />
                        </motion.div>

                        {showIcon && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="absolute bottom-0 right-0 z-[100] group"
                            >
                                <motion.img
                                    whileHover={{ scale: 1.05, rotate: 3 }}
                                    transition={{ duration: 0.3 }}
                                    src={`${base}icon1.png`}
                                    alt=""
                                    className="size-72 hover:cursor-pointer"
                                    onMouseEnter={() => setHovered(true)}
                                    onMouseLeave={() => setHovered(false)}
                                />

                                {hovered && (
                                    <motion.span
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute -top-12 right-10 bg-background text-indigo-700 font-extrabold text-lg px-4 py-2 rounded-full shadow-lg border-4 border-indigo-600 animate-bounce"
                                    >
                                        Click me!
                                    </motion.span>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </>
    )
}

export default Login