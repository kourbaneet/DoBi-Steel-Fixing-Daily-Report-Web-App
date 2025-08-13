import React from 'react'

type TProps = {
    children: React.ReactNode;
}
export default function PublicLayout({children}:TProps) {
  return (
    <div>{children}</div>
  )
}
