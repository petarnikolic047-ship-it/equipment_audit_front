import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '../components/primitives/Button'
import { Card } from '../components/primitives/Card'
import { FormField } from '../components/patterns/FormField'
import { Input } from '../components/primitives/Input'
import { Select } from '../components/primitives/Select'
import { useLoginMutation } from '../features/auth/useLoginMutation'
import { useAuthStore } from '../features/auth/authStore'
import type { LoginRequest } from '../types/auth'
import { useToast } from '../components/patterns/useToast'
import { canRoleAccessPath, getHomePathForRole } from '../features/auth/access'
import inforceLogoTagline from '../assets/brand/inforce-logo-tagline.png'
import camoAssetRed from '../assets/brand/camo-asset-red.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useAuthStore((state) => state.token)
  const role = useAuthStore((state) => state.role)
  const { showToast } = useToast()
  const mutation = useLoginMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    defaultValues: {
      username: 'john.doe',
      password: 'demo',
      role: 'ADMIN',
    },
  })

  useEffect(() => {
    if (token && role) {
      const redirect = searchParams.get('redirect')
      const redirectPath = redirect ? decodeURIComponent(redirect) : getHomePathForRole(role)
      navigate(canRoleAccessPath(role, redirectPath) ? redirectPath : getHomePathForRole(role), { replace: true })
    }
  }, [navigate, role, searchParams, token])

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values)
      showToast('Logged in successfully.', 'success')
      const nextRole = values.role ?? 'ADMIN'
      const redirect = searchParams.get('redirect')
      const redirectPath = redirect ? decodeURIComponent(redirect) : getHomePathForRole(nextRole)
      navigate(canRoleAccessPath(nextRole, redirectPath) ? redirectPath : getHomePathForRole(nextRole), { replace: true })
    } catch (error) {
      const message = (error as { message?: string }).message ?? 'Login failed'
      showToast(message, 'error')
    }
  })

  return (
    <main className="brand-shell grid min-h-screen place-items-center bg-ink-900 p-4">
      <Card className="brand-outline w-full max-w-5xl overflow-hidden p-0">
        <div className="grid md:grid-cols-[1.2fr_1fr]">
          <div className="relative overflow-hidden p-6 md:p-8">
            <img
              src={camoAssetRed}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-95"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(15,15,15,0.18),rgba(15,15,15,0.38))]" />
            <div className="relative z-10">
              <img src={inforceLogoTagline} alt="Inforce Your Fiercest Ally" className="h-10 w-auto" />
              <h1 className="brand-display mt-6 text-5xl leading-[0.92] text-white md:text-6xl">
                Equipment
                <br />
                Audit Control
              </h1>
              <p className="mt-3 max-w-md text-sm text-slate-200">
                Trusted lifecycle operations for asset issuance, custody, returns, and service traceability.
              </p>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <p className="brand-display text-[11px] tracking-[0.2em] text-brand-100">Secure Access</p>
            <h2 className="brand-display mt-1 text-4xl leading-none text-slate-100">Login</h2>
            <p className="mt-2 text-sm text-slate-300">Use password `demo` and select role to test RBAC.</p>
            <form className="mt-5 space-y-3" onSubmit={onSubmit}>
              <FormField label="Username" error={errors.username?.message}>
                <Input {...register('username', { required: 'Username is required' })} />
              </FormField>
              <FormField label="Password" error={errors.password?.message}>
                <Input type="password" {...register('password', { required: 'Password is required' })} />
              </FormField>
              <FormField label="Role">
                <Select {...register('role')}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="MVP">MVP</option>
                </Select>
              </FormField>
              <Button variant="primary" className="w-full" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </div>
        </div>
      </Card>
    </main>
  )
}
