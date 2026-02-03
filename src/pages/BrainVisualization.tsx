import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useBrainData } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Zap, Database } from 'lucide-react';

interface ClusterData {
  id: string;
  position: [number, number, number];
  size: number;
  intensity: number;
  connections: string[];
}

function MemoryCluster({ cluster, onClick }: { cluster: ClusterData; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.002;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + cluster.intensity) * 0.1;
      glowRef.current.scale.setScalar(scale);
    }
  });

  const color = new THREE.Color().setHSL(0.5 + cluster.intensity * 0.2, 0.8, 0.5);

  return (
    <group position={cluster.position} onClick={onClick}>
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[cluster.size * 1.5, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      {/* Main cluster */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[cluster.size, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

function ConnectionLines({ clusters }: { clusters: ClusterData[] }) {
  const lineGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    
    clusters.forEach((cluster) => {
      cluster.connections.forEach((targetId) => {
        const target = clusters.find((c) => c.id === targetId);
        if (target) {
          points.push(new THREE.Vector3(...cluster.position));
          points.push(new THREE.Vector3(...target.position));
        }
      });
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [clusters]);

  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial color="#00b4d8" transparent opacity={0.2} />
    </lineSegments>
  );
}

function BrainScene({ clusters, onClusterClick }: { clusters: ClusterData[]; onClusterClick: (cluster: ClusterData) => void }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 50]} fov={60} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={100}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00b4d8" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      
      {/* Background */}
      <Stars radius={100} depth={50} count={3000} factor={4} fade speed={0.5} />
      
      {/* Connection lines */}
      <ConnectionLines clusters={clusters} />
      
      {/* Memory clusters */}
      {clusters.map((cluster) => (
        <MemoryCluster
          key={cluster.id}
          cluster={cluster}
          onClick={() => onClusterClick(cluster)}
        />
      ))}
    </>
  );
}

// Demo data for when backend isn't connected
const DEMO_CLUSTERS: ClusterData[] = Array.from({ length: 50 }, (_, i) => ({
  id: `cluster-${i}`,
  position: [
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 40,
  ] as [number, number, number],
  size: 0.5 + Math.random() * 1.5,
  intensity: Math.random(),
  connections: Array.from(
    { length: Math.floor(Math.random() * 3) },
    () => `cluster-${Math.floor(Math.random() * 50)}`
  ),
}));

export default function BrainVisualization() {
  const { data: brainData, isLoading, error } = useBrainData();
  
  const clusters = brainData?.clusters ?? DEMO_CLUSTERS;
  const totalMemories = brainData?.totalMemories ?? clusters.length * 100;
  const activeConnections = brainData?.activeConnections ?? clusters.reduce((acc, c) => acc + c.connections.length, 0);

  const handleClusterClick = (cluster: ClusterData) => {
    console.log('Clicked cluster:', cluster);
    // TODO: Show cluster details in a drawer
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brain Visualization</h1>
          <p className="text-muted-foreground">
            3D visualization of the Genesis memory space
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMemories.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Stored across {clusters.length} clusters
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeConnections.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Neural pathway links
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Clusters</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clusters.length}</div>
            <p className="text-xs text-muted-foreground">
              128³ WaveCube nodes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3D Visualization */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Memory Space</CardTitle>
              <CardDescription>
                Click and drag to rotate • Scroll to zoom • Click clusters to inspect
              </CardDescription>
            </div>
            {error ? (
              <Badge variant="destructive">Backend Disconnected</Badge>
            ) : isLoading ? (
              <Badge variant="secondary">Loading...</Badge>
            ) : (
              <Badge variant="default" className="bg-green-600">Live</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] w-full bg-background">
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <Canvas>
                <BrainScene clusters={clusters} onClusterClick={handleClusterClick} />
              </Canvas>
            </Suspense>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
