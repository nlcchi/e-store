"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { AuthService } from "@/services/auth.service";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const authService = AuthService.getInstance();

  const fetchProducts = async () => {
    try {
      const tokens = authService.getTokens();
      if (!tokens) throw new Error("No authentication tokens found");

      const response = await fetch("https://144k9r6646.execute-api.ap-southeast-1.amazonaws.com/v1/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokens.AccessToken}`,
        },
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const productData = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: parseFloat(formData.get("price") as string),
      category: formData.get("category"),
    };

    try {
      const tokens = authService.getTokens();
      if (!tokens) throw new Error("No authentication tokens found");

      const response = await fetch("https://144k9r6646.execute-api.ap-southeast-1.amazonaws.com/v1/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokens.AccessToken}`,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) throw new Error("Failed to create product");

      toast({
        title: "Success",
        description: "Product created successfully",
      });
      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const tokens = authService.getTokens();
      if (!tokens) throw new Error("No authentication tokens found");

      const response = await fetch(`https://144k9r6646.execute-api.ap-southeast-1.amazonaws.com/v1/product/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${tokens.AccessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete product");

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProduct) return;

    const formData = new FormData(event.currentTarget);
    const productData = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: parseFloat(formData.get("price") as string),
      category: formData.get("category"),
    };

    try {
      const tokens = authService.getTokens();
      if (!tokens) throw new Error("No authentication tokens found");

      const response = await fetch(`https://144k9r6646.execute-api.ap-southeast-1.amazonaws.com/v1/product/${selectedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokens.AccessToken}`,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) throw new Error("Failed to update product");

      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (productId: string, file: File, slot: number) => {
    try {
      const tokens = authService.getTokens();
      if (!tokens) throw new Error("No authentication tokens found");

      // First, get the presigned URL
      const response = await fetch(`https://144k9r6646.execute-api.ap-southeast-1.amazonaws.com/v1/product/${productId}/image?slot=${slot}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokens.AccessToken}`,
        },
        body: JSON.stringify({
          fileType: file.type,
        }),
      });

      if (!response.ok) throw new Error("Failed to get upload URL");

      const { uploadUrl } = await response.json();

      // Then upload the image using the presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload image");

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async (productId: string, slot: number) => {
    try {
      const tokens = authService.getTokens();
      if (!tokens) throw new Error("No authentication tokens found");

      const response = await fetch(`https://144k9r6646.execute-api.ap-southeast-1.amazonaws.com/v1/product/${productId}/image?slot=${slot}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${tokens.AccessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete image");

      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add New Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input id="price" name="price" type="number" step="0.01" required />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" required />
              </div>
              <Button type="submit" className="w-full">Create Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Images</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.description}</TableCell>
              <TableCell>${product.price.toFixed(2)}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {[1, 2, 3].map((slot) => (
                    <div key={slot} className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`image-${product.id}-${slot}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(product.id, file, slot);
                        }}
                      />
                      <Label
                        htmlFor={`image-${product.id}-${slot}`}
                        className="cursor-pointer"
                      >
                        {product.images[slot - 1] ? (
                          <div className="relative group">
                            <img
                              src={product.images[slot - 1]}
                              alt={`Product ${slot}`}
                              className="w-10 h-10 object-cover rounded"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 hidden group-hover:flex"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteImage(product.id, slot);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center border rounded">
                            <Upload className="h-4 w-4" />
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateProduct} className="space-y-4">
                        <div>
                          <Label htmlFor="edit-name">Name</Label>
                          <Input
                            id="edit-name"
                            name="name"
                            defaultValue={product.name}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea
                            id="edit-description"
                            name="description"
                            defaultValue={product.description}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-price">Price</Label>
                          <Input
                            id="edit-price"
                            name="price"
                            type="number"
                            step="0.01"
                            defaultValue={product.price}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-category">Category</Label>
                          <Input
                            id="edit-category"
                            name="category"
                            defaultValue={product.category}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Update Product
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}