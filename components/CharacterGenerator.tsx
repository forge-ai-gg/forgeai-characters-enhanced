"use client";

import { CharacterOptions } from "@/components/CharacterOptions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCharacterState } from "@/lib/hooks/useCharacterState";
import { SpriteConfigQueryParams } from "@/types/sprites";
import { Copy, RefreshCw, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export function CharacterGenerator() {
  const {
    config,
    updateOption,
    updateOptions,
    resetConfig,
    randomizeConfig,
    getSpriteUrl,
    isLoading,
  } = useCharacterState();

  const [options, setOptions] = useState<any>({});
  const [spriteKey, setSpriteKey] = useState(0); // Force image refresh
  const [imageLoading, setImageLoading] = useState(true);

  // Fetch options for randomization
  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch("/api/options");
        if (res.ok) {
          const data = await res.json();
          setOptions(data);
        }
      } catch (error) {
        console.error("Failed to fetch options:", error);
      }
    }
    fetchOptions();
  }, []);

  // Force sprite refresh when config changes
  useEffect(() => {
    setSpriteKey((prev) => prev + 1);
    setImageLoading(true);
  }, [config]);

  const handleOptionChange = (key: string, value: string | null) => {
    updateOption(key as keyof SpriteConfigQueryParams, value);
  };

  const handleOptionsChange = (updates: Partial<SpriteConfigQueryParams>) => {
    updateOptions(updates);
  };

  const handleToggleOption = (key: string) => {
    const currentValue = config[key as keyof typeof config];

    switch (key) {
      case "shadow":
        updateOption(
          key as keyof SpriteConfigQueryParams,
          currentValue ? undefined : "Shadow_shadow"
        );
        break;
      case "wounds":
      case "wheelchair":
      case "lizard":
      case "matchBodyColor":
        updateOption(key as keyof SpriteConfigQueryParams, !currentValue);
        break;
      default:
        updateOption(key as keyof SpriteConfigQueryParams, !currentValue);
    }
  };

  const handleRandomize = () => {
    randomizeConfig(options);
  };

  const handleReset = () => {
    resetConfig();
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(getSpriteUrl());
      // You could add a toast notification here
      alert("URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const spriteUrl = getSpriteUrl();
  const selectedOptionsCount = Object.keys(config).filter(
    (key) => config[key as keyof typeof config]
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">LPC Character Generator</h1>
              <p className="text-muted-foreground mt-1">
                Create and customize your character sprite
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Badge variant="secondary" className="gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {selectedOptionsCount} selected
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 max-h-[800px] overflow-hidden">
          {/* Left Panel - Controls */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Customize</CardTitle>
                    <CardDescription className="text-xs">
                      Configure your character
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {selectedOptionsCount}
                  </Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 overflow-hidden pt-4">
                <ScrollArea className="h-full pr-4">
                  {/* Quick Actions */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        onClick={handleRandomize}
                        disabled={isLoading}
                        className="w-full"
                        size="sm"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="animate-spin" />
                            Randomizing...
                          </>
                        ) : (
                          <>
                            <RefreshCw />
                            Randomize
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        <RotateCcw />
                        Reset
                      </Button>

                      <Button
                        onClick={handleCopyUrl}
                        variant="secondary"
                        className="w-full"
                        size="sm"
                      >
                        <Copy />
                        Copy URL
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Character Options */}
                  <CharacterOptions
                    config={config}
                    onOptionChange={handleOptionChange}
                    onOptionsChange={handleOptionsChange}
                    onToggleOption={handleToggleOption}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 min-w-0">
            {/* Sprite Preview */}
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Preview</CardTitle>
                  <Badge variant="outline" className="gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 overflow-auto pt-6">
                {/* Action Buttons at Top */}
                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={handleCopyUrl}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    <Copy />
                    Copy URL
                  </Button>
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="flex-1"
                  >
                    <a
                      href={spriteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Sprite
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="flex-1"
                  >
                    <a
                      href={spriteUrl.replace("/api/sprite", "/api/avatar")}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Avatar
                    </a>
                  </Button>
                </div>

                {/* Collapsible Details */}
                <Accordion type="multiple" className="mb-4">
                  <AccordionItem value="api">
                    <AccordionTrigger className="text-sm font-medium">
                      API Endpoint
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs overflow-x-auto border">
                        <a
                          href={spriteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-green-300 break-all transition-colors"
                        >
                          {spriteUrl}
                        </a>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="config">
                    <AccordionTrigger className="text-sm font-medium">
                      Configuration ({selectedOptionsCount} options)
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {Object.entries(config)
                            .filter(
                              ([_, value]) =>
                                value !== undefined &&
                                value !== null &&
                                value !== false &&
                                value !== ""
                            )
                            .map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                              >
                                <span className="text-xs font-medium text-gray-600 capitalize">
                                  {key
                                    .replace(/([A-Z])/g, " $1")
                                    .replace(/_/g, " ")}
                                </span>
                                <span className="text-xs text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                                  {typeof value === "boolean"
                                    ? value
                                      ? "Yes"
                                      : "No"
                                    : value?.toString().replace(/_/g, " ")}
                                </span>
                              </div>
                            ))}
                          {selectedOptionsCount === 0 && (
                            <div className="text-center text-gray-500 py-4">
                              <p className="text-xs">
                                No customizations applied
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Sprite Preview */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-200 relative overflow-auto h-[600px]">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="grid grid-cols-8 gap-4 h-full">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div key={i} className="bg-gray-400 rounded"></div>
                      ))}
                    </div>
                  </div>

                  {spriteUrl ? (
                    <div className="relative z-10 p-6">
                      {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg z-20">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading sprite...</span>
                          </div>
                        </div>
                      )}
                      <Image
                        key={spriteKey}
                        src={spriteUrl}
                        alt="Generated Character Sprite"
                        width={5200} // 25x larger for better visibility
                        height={21600} // 25x larger, proportional to width
                        className="pixelated drop-shadow-lg"
                        style={{
                          imageRendering: "pixelated",
                          width: "auto",
                          height: "auto",
                        }}
                        unoptimized
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                          console.error("Failed to load sprite image");
                          setImageLoading(false);
                        }}
                      />
                      <div className="mt-4 p-3 bg-white bg-opacity-90 rounded-lg backdrop-blur-sm inline-block">
                        <p className="text-sm font-medium text-gray-700">
                          {selectedOptionsCount} customizations applied
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 relative z-10 flex items-center justify-center h-full">
                      <div>
                        <svg
                          className="w-16 h-16 mx-auto mb-4 text-gray-300"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="text-lg font-medium">
                          Configure your character
                        </p>
                        <p className="text-sm">
                          Select options to see the sprite preview
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
