"use client"

import type React from "react"
import { Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
}

export default function DataTable<T extends { id: number }>({
  data,
  columns,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
}: DataTableProps<T>) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="table-head">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                >
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="!text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="table-body">
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="!py-12 text-center !text-gray-400">
                  Aucun élément à afficher
                </td>
              </tr>
            )}
            {data.map((item, index) => (
              <tr key={index}>
                {columns.map((column, index) => (
                  <td key={String(column.key) + index} className="whitespace-nowrap">
                    {column.render ? column.render(item) : String(item[column.key as keyof T] || "-")}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="btn-icon hover:!bg-brand-50 hover:!text-brand-600"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="btn-icon hover:!bg-danger-soft hover:!text-danger"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && onPageChange && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <div className="font-mono text-xs text-gray-500">
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn btn-outline btn-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="btn btn-outline btn-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
