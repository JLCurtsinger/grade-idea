"use client";

import { useLayoutEffect, useRef, useState } from "react";
import OldHeroField from "@/components/__dev__/OldHeroField";
import CurrentHeroField from "@/components/__dev__/CurrentHeroField";

interface StyleComparison {
  property: string;
  oldValue: string;
  currentValue: string;
  difference: number;
  isColor: boolean;
}

export default function HeroComparePage() {
  const oldFieldRef = useRef<HTMLDivElement>(null);
  const currentFieldRef = useRef<HTMLDivElement>(null);
  const [comparison, setComparison] = useState<StyleComparison[]>([]);
  const [overallPass, setOverallPass] = useState<boolean>(false);

  useLayoutEffect(() => {
    const compareStyles = () => {
      if (!oldFieldRef.current || !currentFieldRef.current) return;

      const oldStyle = window.getComputedStyle(oldFieldRef.current);
      const currentStyle = window.getComputedStyle(currentFieldRef.current);

      const properties = [
        { name: "height", isColor: false },
        { name: "background-color", isColor: true },
        { name: "border-color", isColor: true },
        { name: "border-width", isColor: false },
        { name: "border-radius", isColor: false },
        { name: "padding-top", isColor: false },
        { name: "padding-bottom", isColor: false },
        { name: "font-size", isColor: false },
        { name: "line-height", isColor: false },
      ];

      const comparisons: StyleComparison[] = properties.map(({ name, isColor }) => {
        const oldValue = oldStyle.getPropertyValue(name);
        const currentValue = currentStyle.getPropertyValue(name);
        
        let difference = 0;
        if (!isColor) {
          const oldNum = parseFloat(oldValue);
          const currentNum = parseFloat(currentValue);
          difference = Math.abs(oldNum - currentNum);
        }

        return {
          property: name,
          oldValue,
          currentValue,
          difference,
          isColor,
        };
      });

      setComparison(comparisons);
      
      // Check if all differences are within tolerance
      const allPass = comparisons.every(comp => 
        comp.isColor ? comp.oldValue === comp.currentValue : comp.difference <= 1
      );
      setOverallPass(allPass);
    };

    // Run comparison after a short delay to ensure rendering
    const timer = setTimeout(compareStyles, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Summary Banner */}
        <div className={`p-4 rounded-lg border-2 ${
          overallPass 
            ? "bg-green-50 border-green-200 text-green-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <h1 className="text-xl font-bold">
            {overallPass ? "✅ PASS" : "❌ FAIL"} - Hero Field Visual Parity
          </h1>
          <p className="text-sm mt-1">
            {overallPass 
              ? "All measured properties are within tolerance (±1px, exact color match)"
              : "Some properties exceed tolerance - check the comparison table below"
            }
          </p>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Old (baseline) */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Old (baseline)</h2>
            <div className="bg-surface border border-border rounded-lg p-6">
              <div ref={oldFieldRef}>
                <OldHeroField />
              </div>
            </div>
          </div>

          {/* Current */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Current</h2>
            <div className="bg-surface border border-border rounded-lg p-6">
              <div ref={currentFieldRef}>
                <CurrentHeroField />
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Style Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Property</th>
                  <th className="text-left py-2">Old Value</th>
                  <th className="text-left py-2">Current Value</th>
                  <th className="text-left py-2">Difference</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((comp, index) => (
                  <tr 
                    key={index} 
                    className={`border-b border-border/50 ${
                      comp.isColor 
                        ? comp.oldValue === comp.currentValue 
                          ? "bg-green-50" 
                          : "bg-red-50"
                        : comp.difference <= 1 
                          ? "bg-green-50" 
                          : "bg-red-50"
                    }`}
                  >
                    <td className="py-2 font-mono text-xs">{comp.property}</td>
                    <td className="py-2 font-mono text-xs">{comp.oldValue}</td>
                    <td className="py-2 font-mono text-xs">{comp.currentValue}</td>
                    <td className="py-2 font-mono text-xs">
                      {comp.isColor ? "N/A" : `${comp.difference.toFixed(2)}px`}
                    </td>
                    <td className="py-2">
                      {comp.isColor 
                        ? comp.oldValue === comp.currentValue 
                          ? "✅ Match" 
                          : "❌ Mismatch"
                        : comp.difference <= 1 
                          ? "✅ Pass" 
                          : "❌ Fail"
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile overflow test */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Mobile Overflow Test</h3>
          <div className="w-[375px] border border-border rounded-lg p-4 bg-background">
            <p className="text-xs text-foreground-muted mb-2">Mobile viewport (375px width)</p>
            <CurrentHeroField />
          </div>
        </div>
      </div>
    </div>
  );
}
