"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Pencil, Trash2, Upload, Plus } from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { environment } from "@/config/environment";
import { API_ENDPOINTS } from "@/config/api-endpoints";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();
  const authService = AuthService.getInstance();

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${environment.API_BASE_URL}${API_ENDPOINTS.PRODUCTS.LIST}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      console.log(data);
      setProducts(data.queryResult || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const productData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string),
      };

      const accessToken = authService.getAccessToken();
      const response = await fetch(`${environment.API_BASE_URL}${API_ENDPOINTS.PRODUCTS.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) throw new Error('Failed to create product');

      const newProduct = await response.json();
      
      // If there's an image, upload it
      if (imageFile && newProduct.id) {
        await handleImageUpload(newProduct.id, imageFile);
      }

      toast({
        title: "Success",
        description: "Product created successfully!",
      });

      setIsDialogOpen(false);
      fetchProducts(); // Refresh the product list
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (productId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const accessToken = authService.getAccessToken();
      const response = await fetch(
        `${environment.API_BASE_URL}${API_ENDPOINTS.PRODUCTS.UPLOAD_IMAGE(productId)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Failed to upload image');

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async (productId: string) => {
    try {
      const accessToken = authService.getAccessToken();
      const response = await fetch(
        `${environment.API_BASE_URL}${API_ENDPOINTS.PRODUCTS.DELETE_IMAGE(productId)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete image');

      toast({
        title: "Success",
        description: "Image deleted successfully!",
      });

      fetchProducts(); // Refresh the product list
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-white">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Fill in the product details below.
              </DialogDescription>
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
                <Input 
                  id="price" 
                  name="price" 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="image">Image</Label>
                <Input 
                  id="image" 
                  name="image" 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Product
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="relative w-16 h-16">
                    {product.imageUrl ? (
                      <>
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2"
                          onClick={() => handleDeleteImage(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}