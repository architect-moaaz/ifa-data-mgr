# Dockerizing ifs-Data-Mgr
 Step 1: Create the Dockerfile 
  --- 
     command used: touch Dockerfile
   ---- 
 step 2: Build the docker image.
   ---
    command used: sudo docker build -t intelliflow/ifa-data-mgr --build-arg PROFILE=colo .
   ---
   step 3: Run the docker image.
   ----
    command used: sudo docker run -p 33010:33010 ifa_data
     ---
     The above command starts the data manager image inside the container and exposes port 33010 inside container to port 33010 outside the container.
     ----

   step 4: Check the image created 
   ---
    command used: docker images
   ---
 step 5:Access the route on server using http://localhost:33010

