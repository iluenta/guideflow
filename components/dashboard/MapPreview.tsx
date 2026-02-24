'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin } from 'lucide-react'

interface MapPreviewProps {
    lat: number
    lng: number
    onPositionChange?: (lat: number, lng: number) => void
}

export default function MapPreview({ lat, lng, onPositionChange }: MapPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const markerRef = useRef<mapboxgl.Marker | null>(null)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        if (!containerRef.current) return
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (!token) return

        mapboxgl.accessToken = token

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: 15,
        })

        const marker = new mapboxgl.Marker({ draggable: !!onPositionChange, color: '#6366f1' })
            .setLngLat([lng, lat])
            .addTo(map)

        if (onPositionChange) {
            marker.on('dragend', () => {
                const { lat: newLat, lng: newLng } = marker.getLngLat()
                onPositionChange(newLat, newLng)
            })
        }

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

        map.on('load', () => setLoaded(true))

        mapRef.current = map
        markerRef.current = marker

        return () => {
            map.remove()
            mapRef.current = null
            markerRef.current = null
        }
    }, []) // only on mount

    // Update marker/center when lat/lng props change from outside
    useEffect(() => {
        if (!mapRef.current || !markerRef.current) return
        markerRef.current.setLngLat([lng, lat])
        mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 800 })
    }, [lat, lng])

    return (
        <div className="relative w-full h-52 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <div ref={containerRef} className="w-full h-full" />
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                    <MapPin className="w-5 h-5 text-slate-400 animate-pulse" />
                </div>
            )}
            {onPositionChange && loaded && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
                    Arrastra el pin para ajustar la posición
                </div>
            )}
        </div>
    )
}
