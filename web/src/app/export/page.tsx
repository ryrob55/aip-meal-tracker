'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Trash2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

export default function ExportPage() {
  const { darkMode } = useTheme()
  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/user/export', { method: 'POST' })
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aip-tracker-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setIsDeleting(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      window.location.href = '/login'
    } catch (error) {
      console.error('Delete failed:', error)
      setIsDeleting(false)
    }
  }

  return (
    <div
      className={cn(
        'min-h-screen p-4 pb-24',
        darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
      )}
    >
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/more"
          className={cn(
            'p-2 rounded-lg',
            darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Data & Privacy</h1>
      </div>

      {/* Export */}
      <div
        className={cn(
          'p-4 rounded-xl mb-4',
          darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
        )}
      >
        <h3 className="font-medium mb-2">Export Your Data</h3>
        <p
          className={cn(
            'text-sm mb-4',
            darkMode ? 'text-slate-400' : 'text-slate-600'
          )}
        >
          Download all your data as a JSON file. This includes meals, symptoms,
          reintroduction tests, recipes, and settings.
        </p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
            'bg-blue-500 text-white hover:bg-blue-600',
            isExporting && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export All Data'}
        </button>
      </div>

      {/* Delete Account */}
      <div
        className={cn(
          'p-4 rounded-xl',
          darkMode
            ? 'bg-red-500/10 border border-red-500/30'
            : 'bg-red-50 border border-red-200'
        )}
      >
        <h3 className="font-medium text-red-500 mb-2">Delete Account</h3>
        <p
          className={cn(
            'text-sm mb-4',
            darkMode ? 'text-slate-400' : 'text-slate-600'
          )}
        >
          This permanently deletes your account and all associated data.
          This action cannot be undone. We recommend exporting your data first.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-400">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm',
                darkMode
                  ? 'bg-slate-900 border border-red-500/50 text-white'
                  : 'bg-white border border-red-300'
              )}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm',
                  darkMode ? 'bg-slate-800' : 'bg-slate-200'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium text-white',
                  deleteConfirmText === 'DELETE' && !isDeleting
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-red-500/30 cursor-not-allowed'
                )}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
