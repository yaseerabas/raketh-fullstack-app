'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { 
  LogOut, Users, Loader2, CreditCard, 
  Search, RefreshCw, UserCheck, UserX, Calendar,
  Zap, Key, Plus, Edit, Trash2, Pin, PinOff
} from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  name: string | null
  whatsapp: string | null
  role: string
  subscriptions: Subscription[]
  createdAt: string
}

interface Subscription {
  id: string
  planId: string
  status: string
  creditsPurchased: number
  creditsUsed: number
  startDate: string
  expiresAt: string
  endDate: string | null
  purchasedAt: string
  plan: Plan
  daysRemaining?: number
  isExpired?: boolean
}

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  credits: number
  maxClones: number
  features: string
  durationDays: number
  active: boolean
  pinnedOnHomepage: boolean
  displayOrder: number
}

interface Stats {
  totalUsers: number
  activeSubscriptions: number
  totalCreditsUsed: number
  totalRevenue: number
  recentGenerations: number
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{ [userId: string]: string }>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'subscribed' | 'unsubscribed'>('all')
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalCreditsUsed: 0,
    totalRevenue: 0,
    recentGenerations: 0,
  })

  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Plan management state
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [planFormData, setPlanFormData] = useState({
    name: '',
    price: '',
    credits: '',
    maxClones: '',
    features: '',
    durationDays: '30',
    pinnedOnHomepage: false,
    displayOrder: '0'
  })
  const [isSavingPlan, setIsSavingPlan] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchData()
    }
  }, [status, session])

  const fetchData = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchUsers(), fetchPlans(), fetchStats()])
    setIsRefreshing(false)
    setIsLoading(false)
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      })
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/admin/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSubscribeUser = async (userId: string) => {
    const planId = selectedPlan[userId]
    if (!planId) {
      toast({
        title: 'Error',
        description: 'Please select a plan',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/admin/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User subscribed successfully!',
        })
        fetchData()
        const newSelections = { ...selectedPlan }
        delete newSelections[userId]
        setSelectedPlan(newSelections)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Subscription failed')
      }
    } catch (error: any) {
      console.error('Error subscribing user:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to subscribe user',
        variant: 'destructive',
      })
    }
  }

  const handleUnsubscribeUser = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/admin/subscribe?subscriptionId=${subscriptionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Subscription cancelled successfully!',
        })
        fetchData()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel subscription')
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel subscription',
        variant: 'destructive',
      })
    }
  }

  // Password change handler
  const handleChangePassword = async () => {
    if (!selectedUserForPassword || !newPassword) return

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/admin/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserForPassword.id, newPassword }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Password changed for ${selectedUserForPassword.email}`,
        })
        setPasswordDialogOpen(false)
        setSelectedUserForPassword(null)
        setNewPassword('')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change password')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Plan management handlers
  const openCreatePlanDialog = () => {
    setEditingPlan(null)
    setPlanFormData({
      name: '',
      price: '',
      credits: '',
      maxClones: '',
      features: '',
      durationDays: '30',
      pinnedOnHomepage: false,
      displayOrder: '0'
    })
    setPlanDialogOpen(true)
  }

  const openEditPlanDialog = (plan: Plan) => {
    setEditingPlan(plan)
    let featuresStr = ''
    try {
      const featuresArr = JSON.parse(plan.features)
      featuresStr = Array.isArray(featuresArr) ? featuresArr.join('\n') : plan.features
    } catch {
      featuresStr = plan.features
    }
    setPlanFormData({
      name: plan.name,
      price: plan.price.toString(),
      credits: plan.credits.toString(),
      maxClones: plan.maxClones.toString(),
      features: featuresStr,
      durationDays: (plan.durationDays || 30).toString(),
      pinnedOnHomepage: plan.pinnedOnHomepage,
      displayOrder: plan.displayOrder.toString()
    })
    setPlanDialogOpen(true)
  }

  const handleSavePlan = async () => {
    if (!planFormData.name || !planFormData.price || !planFormData.credits || !planFormData.maxClones) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setIsSavingPlan(true)
    try {
      const featuresArray = planFormData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0)

      const payload = {
        ...planFormData,
        features: JSON.stringify(featuresArray),
        ...(editingPlan ? { id: editingPlan.id } : {})
      }

      const response = await fetch('/api/admin/plans', {
        method: editingPlan ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingPlan ? 'Plan updated successfully' : 'Plan created successfully',
        })
        setPlanDialogOpen(false)
        fetchPlans()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save plan')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save plan',
        variant: 'destructive',
      })
    } finally {
      setIsSavingPlan(false)
    }
  }

  const handleTogglePinPlan = async (plan: Plan) => {
    try {
      const response = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: plan.id, 
          pinnedOnHomepage: !plan.pinnedOnHomepage 
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: plan.pinnedOnHomepage ? 'Plan unpinned from homepage' : 'Plan pinned to homepage',
        })
        fetchPlans()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update plan')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update plan',
        variant: 'destructive',
      })
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return

    try {
      const response = await fetch(`/api/admin/plans?planId=${planId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Plan deleted/deactivated successfully',
        })
        fetchPlans()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete plan')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete plan',
        variant: 'destructive',
      })
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const formatCredits = (credits: number) => {
    return new Intl.NumberFormat('en-US').format(credits)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getCreditsRemaining = (user: User) => {
    const subscription = user.subscriptions[0]
    if (!subscription) return 0
    return Math.max(0, subscription.creditsPurchased - subscription.creditsUsed)
  }

  const getCreditsUsedPercentage = (user: User) => {
    const subscription = user.subscriptions[0]
    if (!subscription || subscription.creditsPurchased === 0) return 0
    return Math.round((subscription.creditsUsed / subscription.creditsPurchased) * 100)
  }

  // Filter users based on search and status
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.whatsapp?.includes(searchQuery)

    const hasSubscription = user.subscriptions.length > 0 && user.subscriptions[0].status === 'active'
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'subscribed' && hasSubscription) ||
      (filterStatus === 'unsubscribed' && !hasSubscription)

    return matchesSearch && matchesFilter
  })

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-lg opacity-50 animate-pulse" />
            <Loader2 className="relative h-12 w-12 animate-spin text-foreground" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(10,10,10,0.7)] backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3 group">
              <Image src="/logo.png" alt="RaketH Clone" width={44} height={44} className="h-11 w-11 object-contain drop-shadow-lg" />
              <div>
                <span className="font-bold text-lg">RaketH Clone</span>
                <Badge variant="secondary" className="ml-2 text-xs bg-white/10 border-white/20">Admin</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {session?.user?.email}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="gap-2 hover:border-red-500/50 hover:bg-red-500/5 hover:text-red-500 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in-up">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage users, subscriptions, and monitor platform activity
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={isRefreshing}
            className="gap-2 self-start hover:border-white/30 hover:bg-white/5 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card border-0 hover-lift animate-fade-in-up">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 hover-lift animate-fade-in-up animation-delay-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                  <p className="text-xs text-muted-foreground">Active Subs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 hover-lift animate-fade-in-up animation-delay-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCredits(stats.totalCreditsUsed)}</p>
                  <p className="text-xs text-muted-foreground">Credits Used</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 hover-lift animate-fade-in-up animation-delay-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6 animate-fade-in-up animation-delay-400">
          <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="users" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <CreditCard className="h-4 w-4" />
              Plans
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            {/* Search and Filter */}
            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email, name, or WhatsApp..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl border-border/50 bg-muted/30 focus:border-white/30 focus:ring-white/20 transition-all"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger className="w-full sm:w-48 rounded-xl border-border/50 bg-muted/30">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="subscribed">Subscribed</SelectItem>
                      <SelectItem value="unsubscribed">No Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card className="glass-card border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Users ({filteredUsers.length})</CardTitle>
                    <CardDescription>
                      {filterStatus === 'all' 
                        ? 'All registered users' 
                        : filterStatus === 'subscribed'
                        ? 'Users with active subscriptions'
                        : 'Users without subscriptions'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                      <UserX className="h-8 w-8 text-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No users match your search' : 'No users found'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.map((user, index) => {
                      const hasActiveSubscription = user.subscriptions.length > 0 && user.subscriptions[0].status === 'active'
                      const subscription = user.subscriptions[0]
                      
                      return (
                        <div 
                          key={user.id} 
                          className="p-4 rounded-xl border border-border/50 bg-muted/30 hover:border-white/20 hover:bg-muted/50 transition-all duration-300 animate-fade-in cursor-pointer"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* User Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold truncate">
                                  {user.name || 'Unnamed User'}
                                </h3>
                                <Badge 
                                  variant={hasActiveSubscription ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {hasActiveSubscription ? subscription.plan.name : 'No Plan'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                {user.whatsapp && (
                                  <span>WhatsApp: {user.whatsapp}</span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Joined {formatDate(user.createdAt)}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 hover:border-white/30 hover:bg-white/5"
                              onClick={() => {
                                setSelectedUserForPassword(user)
                                setNewPassword('')
                                setPasswordDialogOpen(true)
                              }}
                            >
                              <Key className="h-3 w-3" />
                              Change Password
                            </Button>
                          </div>

                          {/* Subscription Details */}
                          {hasActiveSubscription ? (
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs bg-white/10 text-foreground border-white/20">
                                    Active
                                  </Badge>
                                  <span className="text-sm font-medium">
                                    {subscription.plan.name} Plan
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleUnsubscribeUser(subscription.id)}
                                >
                                  Cancel Subscription
                                </Button>
                              </div>

                              {/* Subscription Expiry Info */}
                              {subscription.expiresAt && (
                                <div className={`flex items-center justify-between p-2 rounded-lg mb-3 text-xs ${
                                  subscription.daysRemaining !== undefined && subscription.daysRemaining <= 7 
                                    ? 'bg-red-500/10 border border-red-500/30' 
                                    : 'bg-white/5 border border-white/10'
                                }`}>
                                  <span className={subscription.daysRemaining !== undefined && subscription.daysRemaining <= 7 ? 'text-red-400' : 'text-muted-foreground'}>
                                    {subscription.daysRemaining !== undefined && subscription.daysRemaining > 0 
                                      ? `${subscription.daysRemaining} days remaining`
                                      : 'Expired'}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              
                              {/* Credits Progress */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Credits Usage</span>
                                  <span className="font-medium">
                                    {formatCredits(subscription.creditsUsed)} / {formatCredits(subscription.creditsPurchased)}
                                  </span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      getCreditsUsedPercentage(user) > 90 
                                        ? 'bg-white/40' 
                                        : getCreditsUsedPercentage(user) > 70 
                                        ? 'bg-white/60' 
                                        : 'bg-white/80'
                                    }`}
                                    style={{ width: `${getCreditsUsedPercentage(user)}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{getCreditsUsedPercentage(user)}% used</span>
                                  <span>{formatCredits(getCreditsRemaining(user))} remaining</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-muted/50 border border-border/50 mb-4">
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <UserX className="h-4 w-4" />
                                No active subscription
                              </p>
                            </div>
                          )}

                          {/* Assign Plan */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Select
                              value={selectedPlan[user.id] || ''}
                              onValueChange={(value) =>
                                setSelectedPlan({ ...selectedPlan, [user.id]: value })
                              }
                            >
<SelectTrigger className="flex-1 rounded-xl border-border/50 bg-muted/30">
                              <SelectValue placeholder="Select plan to assign..." />
                            </SelectTrigger>
                            <SelectContent>
                              {plans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  <div className="flex items-center justify-between gap-4">
                                    <span>{plan.name}</span>
                                    <span className="text-muted-foreground">
                                      {formatCurrency(plan.price)}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => handleSubscribeUser(user.id)}
                            disabled={!selectedPlan[user.id]}
                            className="gap-2 gradient-primary text-background border-0 hover:shadow-lg transition-all"
                          >
                            <CreditCard className="h-4 w-4" />
                            {hasActiveSubscription ? 'Change Plan' : 'Subscribe'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          {/* Create Plan Button */}
          <div className="flex justify-end">
            <Button onClick={openCreatePlanDialog} className="gap-2 gradient-primary text-background border-0">
              <Plus className="h-4 w-4" />
              Create Plan
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan, index) => {
              const subscribedCount = users.filter(
                u => u.subscriptions[0]?.plan?.id === plan.id && u.subscriptions[0]?.status === 'active'
              ).length
              
              return (
                <Card 
                  key={plan.id} 
                  className={`glass-card border-0 hover-lift animate-fade-in-up ${plan.pinnedOnHomepage ? 'ring-2 ring-white/30' : ''}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {plan.pinnedOnHomepage && (
                        <Badge className="text-xs gradient-primary text-background border-0">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-2xl font-bold text-gradient">
                      {formatCurrency(plan.price)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Credits</span>
                        <span className="font-medium">{formatCredits(plan.credits)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Max Clones</span>
                        <span className="font-medium">
                          {plan.maxClones === -1 ? 'Unlimited' : plan.maxClones}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Subscribers</span>
                        <Badge variant="secondary" className="text-xs bg-white/10 border-white/20">
                          {subscribedCount} users
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Display Order</span>
                        <span className="font-medium">{plan.displayOrder}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <Badge 
                        variant={plan.active ? 'default' : 'secondary'}
                        className={`w-full justify-center ${plan.active ? 'gradient-primary text-background border-0' : ''}`}
                      >
                        {plan.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs hover:border-white/30 hover:bg-white/5"
                          onClick={() => handleTogglePinPlan(plan)}
                        >
                          {plan.pinnedOnHomepage ? <PinOff className="h-3 w-3 mr-1" /> : <Pin className="h-3 w-3 mr-1" />}
                          {plan.pinnedOnHomepage ? 'Unpin' : 'Pin'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs hover:border-white/30 hover:bg-white/5"
                          onClick={() => openEditPlanDialog(plan)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle>Change User Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUserForPassword?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl border-border/50 bg-muted/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={isChangingPassword || newPassword.length < 6}
              className="gradient-primary text-background border-0"
            >
              {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Create/Edit Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="glass-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Update the plan details' : 'Create a new subscription plan'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="planName">Plan Name *</Label>
              <Input
                id="planName"
                placeholder="e.g., Basic, Pro, Premium"
                value={planFormData.name}
                onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                className="rounded-xl border-border/50 bg-muted/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planPrice">Price (PKR) *</Label>
                <Input
                  id="planPrice"
                  type="number"
                  placeholder="1499"
                  value={planFormData.price}
                  onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                  className="rounded-xl border-border/50 bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planCredits">Credits *</Label>
                <Input
                  id="planCredits"
                  type="number"
                  placeholder="1000000"
                  value={planFormData.credits}
                  onChange={(e) => setPlanFormData({ ...planFormData, credits: e.target.value })}
                  className="rounded-xl border-border/50 bg-muted/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planMaxClones">Max Clones *</Label>
                <Input
                  id="planMaxClones"
                  type="number"
                  placeholder="5 (-1 for unlimited)"
                  value={planFormData.maxClones}
                  onChange={(e) => setPlanFormData({ ...planFormData, maxClones: e.target.value })}
                  className="rounded-xl border-border/50 bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planDurationDays">Duration (days)</Label>
                <Input
                  id="planDurationDays"
                  type="number"
                  placeholder="30"
                  value={planFormData.durationDays}
                  onChange={(e) => setPlanFormData({ ...planFormData, durationDays: e.target.value })}
                  className="rounded-xl border-border/50 bg-muted/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="planDisplayOrder">Display Order</Label>
              <Input
                id="planDisplayOrder"
                type="number"
                placeholder="0"
                value={planFormData.displayOrder}
                onChange={(e) => setPlanFormData({ ...planFormData, displayOrder: e.target.value })}
                className="rounded-xl border-border/50 bg-muted/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planFeatures">Features (one per line)</Label>
              <Textarea
                id="planFeatures"
                placeholder="All voice models&#10;Voice cloning&#10;Email support"
                value={planFormData.features}
                onChange={(e) => setPlanFormData({ ...planFormData, features: e.target.value })}
                className="rounded-xl border-border/50 bg-muted/30 min-h-[100px]"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
              <div>
                <Label htmlFor="pinnedSwitch" className="font-medium">Pin to Homepage</Label>
                <p className="text-xs text-muted-foreground">Show this plan in the pricing section</p>
              </div>
              <Switch
                id="pinnedSwitch"
                checked={planFormData.pinnedOnHomepage}
                onCheckedChange={(checked) => setPlanFormData({ ...planFormData, pinnedOnHomepage: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSavePlan} 
              disabled={isSavingPlan}
              className="gradient-primary text-background border-0"
            >
              {isSavingPlan ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  </div>
  )
}
