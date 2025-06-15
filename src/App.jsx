import React, { useState, useEffect } from 'react';
import {
  Play,
  RefreshCw,
  Info,
  Grid,
  Target,
  Layers,
  TrendingUp
} from 'lucide-react';

const PercolationAnalyzer = () => {
  // Siatka 11x11 z wzorem z obrazka
  const originalGrid = [
    [0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0],
    [0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
    [1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0]
  ];

  const [grid, setGrid] = useState(originalGrid);
  const [clusters, setClusters] = useState([]);
  const [percolationPath, setPercolationPath] = useState([]);
  const [parameters, setParameters] = useState({});
  const [gridType, setGridType] = useState('square');
  const [analyzed, setAnalyzed] = useState(false);

  // Funkcja do znajdowania klastrów (Union-Find)
  const findClusters = matrix => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const visited = Array(rows)
      .fill()
      .map(() => Array(cols).fill(false));
    const clusters = [];

    const directions =
      gridType === 'square'
        ? [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0]
          ] // 4-connected
        : [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0],
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1]
          ]; // 8-connected

    const dfs = (r, c, cluster) => {
      if (
        r < 0 ||
        r >= rows ||
        c < 0 ||
        c >= cols ||
        visited[r][c] ||
        matrix[r][c] === 0
      )
        return;

      visited[r][c] = true;
      cluster.push([r, c]);

      for (let [dr, dc] of directions) {
        dfs(r + dr, c + dc, cluster);
      }
    };

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (matrix[i][j] === 1 && !visited[i][j]) {
          const cluster = [];
          dfs(i, j, cluster);
          if (cluster.length > 0) {
            clusters.push(cluster);
          }
        }
      }
    }

    return clusters;
  };

  // Sprawdzenie perkolacji
  const checkPercolation = (matrix, clusters) => {
    const rows = matrix.length;
    const cols = matrix[0].length;

    // Perkolacja pionowa (góra-dół)
    const verticalPercolation = clusters.find(cluster => {
      const hasTop = cluster.some(([r, c]) => r === 0);
      const hasBottom = cluster.some(([r, c]) => r === rows - 1);
      return hasTop && hasBottom;
    });

    // Perkolacja pozioma (lewo-prawo)
    const horizontalPercolation = clusters.find(cluster => {
      const hasLeft = cluster.some(([r, c]) => c === 0);
      const hasRight = cluster.some(([r, c]) => c === cols - 1);
      return hasLeft && hasRight;
    });

    return {
      vertical: !!verticalPercolation,
      horizontal: !!horizontalPercolation,
      verticalPath: verticalPercolation || [],
      horizontalPath: horizontalPercolation || []
    };
  };

  // Obliczenie parametrów perkolacji
  const calculateParameters = () => {
    const rows = grid.length;
    const cols = grid[0].length;
    const totalSites = rows * cols;
    const occupiedSites = grid.flat().filter(cell => cell === 1).length;

    const foundClusters = findClusters(grid);
    const percolation = checkPercolation(grid, foundClusters);

    const largestCluster = foundClusters.reduce(
      (max, cluster) => (cluster.length > max.length ? cluster : max),
      []
    );

    // Gęstość perkolacyjna
    const density = occupiedSites / totalSites;

    // Średni rozmiar klastra
    const avgClusterSize =
      foundClusters.length > 0
        ? foundClusters.reduce((sum, cluster) => sum + cluster.length, 0) /
          foundClusters.length
        : 0;

    // Prawdopodobieństwo krytyczne dla siatki kwadratowej ≈ 0.5927
    const criticalProbability = gridType === 'square' ? 0.5927 : 0.5;

    setClusters(foundClusters);
    setPercolationPath(
      percolation.verticalPath.length > 0
        ? percolation.verticalPath
        : percolation.horizontalPath
    );
    setParameters({
      totalSites,
      occupiedSites,
      density: density.toFixed(4),
      criticalProbability: criticalProbability.toFixed(4),
      numClusters: foundClusters.length,
      largestClusterSize: largestCluster.length,
      avgClusterSize: avgClusterSize.toFixed(2),
      percolates: percolation.vertical || percolation.horizontal,
      verticalPercolation: percolation.vertical,
      horizontalPercolation: percolation.horizontal,
      susceptibility: largestCluster.length / occupiedSites,
      correlationLength: Math.sqrt(largestCluster.length)
    });
    setAnalyzed(true);
  };

  // Generowanie nowej losowej siatki 11x11
  const generateRandomGrid = () => {
    const p = 0.5 + (Math.random() - 0.5) * 0.3; // p między 0.35-0.65
    const newGrid = Array(11)
      .fill()
      .map(() =>
        Array(11)
          .fill()
          .map(() => (Math.random() < p ? 1 : 0))
      );
    setGrid(newGrid);
    setAnalyzed(false);
  };

  // Resetowanie do oryginalnej siatki
  const resetToOriginal = () => {
    setGrid(originalGrid);
    setAnalyzed(false);
  };

  // Kolorowanie klastrów
  const getCellColor = (r, c) => {
    if (grid[r][c] === 0) return 'bg-gray-100';

    // Sprawdź czy należy do ścieżki perkolacyjnej
    if (percolationPath.some(([pr, pc]) => pr === r && pc === c)) {
      return 'bg-red-500 border-red-600';
    }

    // Znajdź klaster dla tej komórki
    const clusterIndex = clusters.findIndex(cluster =>
      cluster.some(([cr, cc]) => cr === r && cc === c)
    );

    if (clusterIndex === -1) return 'bg-gray-800';

    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500'
    ];

    return colors[clusterIndex % colors.length];
  };

  useEffect(() => {
    if (analyzed) {
      calculateParameters();
    }
  }, [gridType]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 flex items-center justify-center gap-3">
          <Grid className="text-blue-600" />
          Analiza Perkolacji - Kalkulator Parametrów
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Siatka */}
          <div className="space-y-6">
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={calculateParameters}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play size={16} />
                Analizuj
              </button>
              <button
                onClick={generateRandomGrid}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <RefreshCw size={16} />
                Losowa siatka
              </button>
              <button
                onClick={resetToOriginal}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Target size={16} />
                Reset
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Typ siatki:
              </label>
              <select
                value={gridType}
                onChange={e => setGridType(e.target.value)}
                className="border rounded-lg px-3 py-2 bg-white"
              >
                <option value="square">Kwadratowa (4-connected)</option>
                <option value="diagonal">Z przekątnymi (8-connected)</option>
              </select>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Layers size={16} />
                Siatka {grid.length}×{grid[0].length}
              </h3>
              <div className="inline-block border-2 border-gray-300 rounded-lg overflow-hidden">
                {grid.map((row, r) => (
                  <div key={r} className="flex">
                    {row.map((cell, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={`w-6 h-6 border border-gray-200 ${getCellColor(
                          r,
                          c
                        )}
                          ${
                            analyzed ? 'transition-colors duration-300' : ''
                          } cursor-pointer hover:opacity-80`}
                        onClick={() => {
                          const newGrid = [...grid];
                          newGrid[r][c] = 1 - newGrid[r][c];
                          setGrid(newGrid);
                          setAnalyzed(false);
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Kliknij komórki aby zmienić stan • Czerwone = ścieżka
                perkolacyjna
              </p>
            </div>
          </div>

          {/* Parametry */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-800">
                <TrendingUp size={20} />
                Parametry Perkolacji
              </h3>

              {analyzed ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-gray-600">Całkowite miejsca</div>
                      <div className="font-bold text-lg">
                        {parameters.totalSites}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-gray-600">Zajęte miejsca</div>
                      <div className="font-bold text-lg">
                        {parameters.occupiedSites}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-gray-600">Gęstość (p)</div>
                      <div className="font-bold text-lg text-blue-600">
                        {parameters.density}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-gray-600">p krytyczne</div>
                      <div className="font-bold text-lg text-orange-600">
                        {parameters.criticalProbability}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-800">
                      Status Perkolacji
                    </h4>
                    <div className="space-y-2">
                      <div
                        className={`p-2 rounded ${
                          parameters.percolates
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        <strong>Perkoluje:</strong>{' '}
                        {parameters.percolates ? 'TAK' : 'NIE'}
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          Pionowa:{' '}
                          {parameters.verticalPercolation ? '✅' : '❌'}
                        </div>
                        <div>
                          Pozioma:{' '}
                          {parameters.horizontalPercolation ? '✅' : '❌'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-800">
                      Statystyki Klastrów
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Liczba klastrów:</span>
                        <span className="font-semibold">
                          {parameters.numClusters}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Największy klaster:</span>
                        <span className="font-semibold">
                          {parameters.largestClusterSize}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Średni rozmiar:</span>
                        <span className="font-semibold">
                          {parameters.avgClusterSize}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Podatność χ:</span>
                        <span className="font-semibold">
                          {parameters.susceptibility?.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Długość korelacji ξ:</span>
                        <span className="font-semibold">
                          {parameters.correlationLength?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info size={16} className="text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <div className="font-semibold mb-1">Interpretacja:</div>
                        <div>
                          {parseFloat(parameters.density) >
                          parseFloat(parameters.criticalProbability)
                            ? 'Gęstość przekracza próg krytyczny - spodziewana perkolacja'
                            : 'Gęstość poniżej progu krytycznego - perkolacja mniej prawdopodobna'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Grid size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Kliknij "Analizuj" aby obliczyć parametry perkolacji</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PercolationAnalyzer;
