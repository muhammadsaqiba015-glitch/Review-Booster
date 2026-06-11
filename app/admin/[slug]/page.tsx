import AdminDashboard from '@/components/AdminDashboard'

export default function AdminPage({ params }: { params: { slug: string } }) {
    return <AdminDashboard businessSlug={params.slug} />
}