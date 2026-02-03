import { Suspense, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrainData } from '@/hooks/useApi';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RefreshCw, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Cluster {
  id: string;
  x: number;
  y: number;
  z: number;
  activation: number;
  octave: number;
  connections: string[];
}

interface MemoryParticlesProps {
  clusters: Cluster[];
  highlightedId: string | null;
  onSelect: (id: string | null) => void;
}

function MemoryParticles({ clusters, highlightedId, onSelect }: MemoryParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorArray = useMemo(() => new Float32Array(clusters.length * 3), [clusters.length]);

  // Octave color mapping
  const octaveColors = useMemo(() => [
    new THREE.Color('#3b82f6'), // Blue
    new THREE.Color('#8b5cf6'), // Purple
    new THREE.Color('#ec4899'), // Pink
    new THREE.Color('#f97316'), // Orange
    new THREE.Color('#22c55e'), // Green
    new THREE.Color('#eab308'), // Yellow
    new THREE.Color('#06b6d4'), // Cyan
    new THREE.Color('#ef4444'), // Red
  ], []);

  useFrame((state) => {
    if (!meshRef.current) return;

    clusters.forEach((cluster, i) => {
      // Position with slight floating animation
      const time = state.clock.elapsedTime;
      const floatOffset = Math.sin(time * 0.5 + i * 0.1) * 0.1;
      
      dummy.position.set(cluster.x, cluster.y + floatOffset, cluster.z);
      
      // Scale based on activation
      const baseScale = 0.3 + cluster.activation * 0.5;
      const pulseScale = highlightedId === cluster.id ? 
        baseScale * (1 + Math.sin(time * 3) * 0.2) : 
        baseScale;
      dummy.scale.setScalar(pulseScale);
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Color based on octave
      const color = octaveColors[cluster.octave % octaveColors.length];
      const brightness = highlightedId === cluster.id ? 1.5 : 0.7 + cluster.activation * 0.3;
      colorArray[i * 3] = color.r * brightness;
      colorArray[i * 3 + 1] = color.g * brightness;
      colorArray[i * 3 + 2] = color.b * brightness;
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.geometry.attributes.color.needsUpdate = true;
  });

  const handleClick = (event: any) => {
    event.stopPropagation?.();
    const instanceId = event.instanceId;
    if (instanceId !== undefined && clusters[instanceId]) {
      onSelect(clusters[instanceId].id);
    }
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, clusters.length]}
      onClick={handleClick}
    >
      <sphereGeometry args={[1, 16, 16]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colorArray, 3]}
        />
      </sphereGeometry>
      <meshStandardMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}

function ConnectionLines({ clusters, highlightedId }: { clusters: Cluster[]; highlightedId: string | null }) {
  const linesRef = useRef<THREE.LineSegments>(null);

  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    const clusterMap = new Map(clusters.map(c => [c.id, c]));

    clusters.forEach(cluster => {
      if (highlightedId && cluster.id !== highlightedId) return;
      
      cluster.connections.forEach(connId => {
        const target = clusterMap.get(connId);
        if (target) {
          positions.push(cluster.x, cluster.y, cluster.z);
          positions.push(target.x, target.y, target.z);
        }
      });
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [clusters, highlightedId]);

  return (
    <lineSegments ref={linesRef} geometry={lineGeometry}>
      <lineBasicMaterial color="#4b5563" opacity={0.3} transparent />
    </lineSegments>
  );
}

function BrainScene({ clusters, highlightedId, onSelect }: MemoryParticlesProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      <ConnectionLines clusters={clusters} highlightedId={highlightedId} />
      <MemoryParticles clusters={clusters} highlightedId={highlightedId} onSelect={onSelect} />
      
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />
      <PerspectiveCamera makeDefault position={[20, 20, 20]} />
    </>
  );
}

function BrainVisualizationPage() {
  const { data: brainData, isLoading, refetch } = useBrainData();
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [particleSize, setParticleSize] = useState([0.5]);

  // Generate demo data if API doesn't return data
  const clusters: Cluster[] = useMemo(() => {
    if (brainData?.clusters) return brainData.clusters;
    
    // Demo: Generate 500 random clusters for visualization
    const demo: Cluster[] = [];
    for (let i = 0; i < 500; i++) {
      demo.push({
        id: `cluster-${i}`,
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20,
        activation: Math.random(),
        octave: Math.floor(Math.random() * 8),
        connections: demo.length > 0 
          ? [demo[Math.floor(Math.random() * demo.length)].id]
          : [],
      });
    }
    return demo;
  }, [brainData]);

  const selectedClusterData = useMemo(() => {
    return clusters.find(c => c.id === selectedCluster);
  }, [clusters, selectedCluster]);

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Brain Visualization</h1>
            <p className="text-muted-foreground">
              Interactive 3D view of the memory space ({clusters.length} clusters)
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 gap-4">
          <Card className="flex-1">
            <CardContent className="h-full p-0">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <Canvas
                  className="h-full w-full"
                  gl={{ antialias: true, alpha: false }}
                  onPointerMissed={() => setSelectedCluster(null)}
                >
                  <color attach="background" args={['#0a0a0f']} />
                  <fog attach="fog" args={['#0a0a0f', 30, 60]} />
                  <Suspense fallback={null}>
                    <BrainScene
                      clusters={clusters}
                      highlightedId={selectedCluster}
                      onSelect={setSelectedCluster}
                    />
                  </Suspense>
                </Canvas>
              )}
            </CardContent>
          </Card>

          <Card className="w-80">
            <CardHeader>
              <CardTitle className="text-base">Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Particle Size</Label>
                <Slider
                  value={particleSize}
                  onValueChange={setParticleSize}
                  min={0.1}
                  max={1}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label>Navigation</Label>
                <p className="text-xs text-muted-foreground">
                  • Left-click + drag to rotate<br />
                  • Right-click + drag to pan<br />
                  • Scroll to zoom<br />
                  • Click a cluster to select
                </p>
              </div>

              {selectedClusterData && (
                <div className="space-y-2 rounded-md border p-3">
                  <h4 className="font-medium">Selected Cluster</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">ID:</span> {selectedClusterData.id}</p>
                    <p><span className="text-muted-foreground">Octave:</span> {selectedClusterData.octave}</p>
                    <p><span className="text-muted-foreground">Activation:</span> {(selectedClusterData.activation * 100).toFixed(1)}%</p>
                    <p><span className="text-muted-foreground">Connections:</span> {selectedClusterData.connections.length}</p>
                    <p className="text-muted-foreground">
                      Position: ({selectedClusterData.x.toFixed(2)}, {selectedClusterData.y.toFixed(2)}, {selectedClusterData.z.toFixed(2)})
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Octave Legend</Label>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {['Blue', 'Purple', 'Pink', 'Orange', 'Green', 'Yellow', 'Cyan', 'Red'].map((color, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ 
                          backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#eab308', '#06b6d4', '#ef4444'][i] 
                        }} 
                      />
                      <span>Octave {i}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default BrainVisualizationPage;
