import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

export default function DealsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-4xl font-bold">Today's Deals</h1>
        <Badge variant="secondary" className="text-lg">
          <Tag className="w-4 h-4 mr-1" />
          Special Offers
        </Badge>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-lg text-muted-foreground">Check back soon for amazing deals!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}