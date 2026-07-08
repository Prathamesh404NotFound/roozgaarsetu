import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Briefcase, MapPin, Clock, IndianRupee, Calendar, Building } from "lucide-react";
import { useFirebase } from "@/context/FirebaseContext";
import { jobService, Job } from "@/services/firebase";

const JobCard = ({ job }: { job: Job }) => {
  const { isAuthenticated } = useFirebase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
            {job.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Building className="h-4 w-4" />
            <span>{job.employerName}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{job.jobType.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
        {job.employerLogo && (
          <img
            src={job.employerLogo}
            alt={job.employerName}
            className="w-12 h-12 rounded-lg object-cover"
            loading="lazy"
          />
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {job.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          {job.salaryMin && job.salaryMax && (
            <div className="flex items-center gap-1 text-primary font-medium">
              <IndianRupee className="h-4 w-4" />
              <span>{job.salaryMin.toLocaleString('en-IN')} - {job.salaryMax.toLocaleString('en-IN')}</span>
            </div>
          )}
          {job.experienceMin && (
            <div className="text-muted-foreground">
              {job.experienceMin}+ years
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
            {job.category}
          </span>
          {isAuthenticated ? (
            <button className="px-3 py-1 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Apply Now
            </button>
          ) : (
            <button className="px-3 py-1 text-sm font-medium bg-muted text-muted-foreground rounded-lg cursor-not-allowed">
              Login to Apply
            </button>
          )}
        </div>
      </div>

      {job.deadline && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Apply by: {new Date(job.deadline).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const JobListingsSection = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useFirebase();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobList = await jobService.getJobs();
        setJobs(jobList);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  if (loading) {
    return (
      <section className="py-20 lg:py-28 bg-secondary/5">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-heading text-3xl font-bold md:text-4xl mb-4">
              Loading Jobs...
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-background border border-border rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 lg:py-28 bg-secondary/5">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Latest Opportunities
          </span>
          <h2 className="mb-4 font-heading text-3xl font-bold md:text-4xl">
            Featured Job Listings
          </h2>
          <p className="text-lg text-muted-foreground">
            Discover exciting career opportunities from top employers. {isAuthenticated ? 'Start applying today!' : 'Sign in to unlock all features.'}
          </p>
        </motion.div>

        {jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No jobs available yet
            </h3>
            <p className="text-muted-foreground">
              Check back soon for new opportunities from employers.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </motion.div>
        )}

        {jobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-12"
          >
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              View All Jobs
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};
