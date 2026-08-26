export const demoUsers = {
  farmer: {
    id: "66cafe000000000000000001",
    role: "FARMER",
    name: "Asha Pawar",
    phone: "+919876500001",
    location: "Pimpalgaon, Nashik"
  },
  buyer: {
    id: "66cafe000000000000000002",
    role: "BUYER",
    name: "FreshCart Procurement",
    phone: "+919876500002",
    location: "Pune"
  },
  transporter: {
    id: "66cafe000000000000000003",
    role: "TRANSPORTER",
    name: "Ganesh Logistics",
    phone: "+919876500003",
    location: "Nashik"
  },
  storage: {
    id: "66cafe000000000000000004",
    role: "STORAGE",
    name: "Niphad Cold Storage",
    phone: "+919876500004",
    location: "Niphad"
  },
  government: {
    id: "66cafe000000000000000005",
    role: "GOVERNMENT",
    name: "Maharashtra Agriculture Desk",
    phone: "+919876500005",
    location: "Mumbai"
  }
};

export function demoUserMiddleware(request, response, next) {
  const role = request.header("x-demo-role")?.toLowerCase() ?? "farmer";
  request.user = demoUsers[role] ?? demoUsers.farmer;
  next();
}
