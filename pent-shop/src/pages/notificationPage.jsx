import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Swal from "sweetalert2";
import emailjs from "emailjs-com";

const NotificationPage = () => {
  const [formData, setFormData] = useState({
    to_name: "",
    from_name: "Admin",
    message: "",
    to_email: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendNotification = (e) => {
    e.preventDefault();
    setLoading(true);

    emailjs
      .send(
        "your_service_id", // 🔑 Replace with your EmailJS Service ID
        "your_template_id", // 🔑 Replace with your EmailJS Template ID
        formData,
        "your_user_id" // 🔑 Replace with your EmailJS Public Key
      )
      .then(
        (result) => {
          setLoading(false);
          Swal.fire({
            icon: "success",
            title: "Notification Sent!",
            text: "Your email was successfully sent.",
          });
          setFormData({ to_name: "", from_name: "Admin", message: "", to_email: "" });
        },
        (error) => {
          setLoading(false);
          Swal.fire({
            icon: "error",
            title: "Failed to Send",
            text: "Something went wrong. Please check your EmailJS credentials.",
          });
          console.error("❌ EmailJS Error:", error);
        }
      );
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <Card className="w-full max-w-lg shadow-2xl rounded-2xl">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Send Notification</h2>
          <form onSubmit={sendNotification} className="space-y-4">
            <Input
              type="text"
              name="to_name"
              placeholder="Recipient Name"
              value={formData.to_name}
              onChange={handleChange}
              required
            />

            <Input
              type="email"
              name="to_email"
              placeholder="Recipient Email"
              value={formData.to_email}
              onChange={handleChange}
              required
            />

            <Textarea
              name="message"
              placeholder="Enter your message"
              value={formData.message}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Notification"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPage;
