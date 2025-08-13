import React from 'react'

type TProps = {
    children: React.ReactNode;
}
export default function DashboardLayout({children}:TProps) {
  return (
    <div>{children}</div>
  )
}
