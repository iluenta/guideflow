'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Card } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface MapPreviewProps {
    lat: number
    lng: number
    draggable?: boolean
    onPositionChange?: (lat: number, lng: number) => void
    height?: string
}

export default function MapPreview({
    lat,
    lng,
    draggable = true,
    onPositionChange,
    height = '300px'
}: MapPreviewProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const marker = useRef<mapboxgl.Marker | null>(null)
    const [mapLoaded, setMapLoaded] = useState(false)

    useEffect(() => {
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

        if (!mapContainer.current || map.current) return

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: 18,
            attributionControl: false
        })

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

        map.current.on('load', () => {
            setMapLoaded(true)
        })

        marker.current = new mapboxgl.Marker({
            draggable: draggable,
            color: '#316263'
        })
            .setLngLat([lng, lat])
            .addTo(map.current)

        if (draggable) {
            marker.current.on('dragend', () => {
                const lngLat = marker.current?.getLngLat()
                if (lngLat && onPositionChange) {
                    onPositionChange(lngLat.lat, lngLat.lng)
                }
            })
        }

        return () => {
            map.current?.remove()
            map.current = null
        }
    }, [])

    // Update marker and map center when props change (from external geocoding)
    useEffect(() => {
        if (map.current && marker.current) {
            map.current.flyTo({ center: [lng, lat], zoom: 18 })
            marker.current.setLngLat([lng, lat])
        }
    }, [lat, lng])

    return (
        <Card className="relative overflow-hidden border-slate-200 shadow-sm rounded-xl">
            <div
                ref={mapContainer}
                style={{ width: '100%', height }}
                className="bg-slate-100"
            />
            {draggable && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-white/90 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-medium text-slate-700 uppercase tracking-wider">
                            Arrastra el pin para ajustar precisión
                        </span>
                    </div>
                </div>
            )}
            {!mapboxgl.accessToken && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-500 text-sm p-4 text-center">
                    Mapbox token missing. Please set NEXT_PUBLIC_MAPBOX_TOKEN.
                </div>
            )}
        </Card>
    )
}
