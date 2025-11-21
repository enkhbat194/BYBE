import React, { useEffect } from "react";
import { useAIConfigStore } from "@/lib/aiConfig";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { RefreshCw } from "lucide-react";
import type { AIModelInfo, AIProviderConfig } from "@/lib/aiConfig";

export default function AISettings() {
  const {
    providers,
    selectedProviderId,
    selectedModelId,
    apiKeys,
    modelsByProvider,
    advancedSettings,
    setSelectedProvider,
    setSelectedModel,
    setApiKey,
    setAdvancedSettings,
    syncModelsForProvider,
  } = useAIConfigStore();

  const models = modelsByProvider[selectedProviderId] ?? [];

  useEffect(() => {
    // Provider солигдоход автоматаар models sync
    syncModelsForProvider(selectedProviderId);
  }, [selectedProviderId, syncModelsForProvider]);

  const currentKey = apiKeys[selectedProviderId] ?? "";

  return (
    <div className="space-y-4">
      {/* Provider */}
      <div className="space-y-2">
        <Label>AI Provider</Label>
        <Select value={selectedProviderId} onValueChange={setSelectedProvider}>
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((p: AIProviderConfig) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label>API Key ({selectedProviderId})</Label>
        <Input
          type="password"
          value={currentKey}
          onChange={(e) => setApiKey(selectedProviderId, e.target.value)}
          placeholder="Enter API key"
        />
      </div>

      {/* Model */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Model</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncModelsForProvider(selectedProviderId)}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh models
          </Button>
        </div>

        <Select
          value={selectedModelId ?? undefined}
          onValueChange={setSelectedModel}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {models.length === 0 ? (
              <div className="px-2 py-1 text-xs text-muted-foreground">
                No models found – check API key or click Refresh.
              </div>
            ) : (
              models.map((m: AIModelInfo) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name ?? m.id}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Advanced settings */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="streamResponse">Enable Streaming</Label>
          <Switch
            id="streamResponse"
            checked={advancedSettings.streamResponse}
            onCheckedChange={(checked) =>
              setAdvancedSettings({ streamResponse: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="temperature">Temperature</Label>
            <span className="text-xs text-muted-foreground">
              {advancedSettings.temperature.toFixed(1)}
            </span>
          </div>
          <Slider
            id="temperature"
            min={0}
            max={1}
            step={0.1}
            value={[advancedSettings.temperature]}
            onValueChange={(value) =>
              setAdvancedSettings({ temperature: value[0] })
            }
          />
          <p className="text-xs text-muted-foreground">
            Higher values = more creative, lower values = more focused
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <span className="text-xs text-muted-foreground">
              {advancedSettings.maxTokens || 2048}
            </span>
          </div>
          <Slider
            id="maxTokens"
            min={256}
            max={8192}
            step={256}
            value={[(advancedSettings.maxTokens || 2048)]}
            onValueChange={(value) =>
              setAdvancedSettings({ maxTokens: value[0] })
            }
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of tokens to generate
          </p>
        </div>
      </div>
    </div>
  );
}
