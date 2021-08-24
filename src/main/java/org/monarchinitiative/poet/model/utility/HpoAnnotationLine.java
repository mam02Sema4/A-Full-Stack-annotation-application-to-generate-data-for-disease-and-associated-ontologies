package org.monarchinitiative.poet.model.utility;

import com.google.common.collect.ImmutableList;
import org.monarchinitiative.phenol.annotations.formats.hpo.HpoFrequency;
import org.monarchinitiative.phenol.annotations.formats.hpo.HpoOnset;
import org.monarchinitiative.phenol.base.PhenolException;
import org.monarchinitiative.phenol.ontology.data.Ontology;
import org.monarchinitiative.phenol.ontology.data.TermId;

import java.util.List;

/**
 * This class is a copy pasta from phenol to POET to support the parsing of phenotype.hpoa
 */
public class HpoAnnotationLine {

    private static final int DATABASE_ID_IDX = 0;
    private static final int DB_NAME_IDX = 1;
    private static final int QUALIFIER_IDX = 2;
    private static final int PHENOTYPE_ID_IDX = 3;
    private static final int DB_REFERENCE_IDX = 4;
    private static final int EVIDENCE_IDX = 5;
    private static final int ONSET_ID_IDX = 6;
    private static final int FREQUENCY_IDX = 7;
    private static final int SEX_IDX = 8;
    private static final int MODIFIER_IDX = 9;
    private static final int ASPECT_IDX = 10;
    private static final int BIOCURATION_IDX = 11;

    private static final String EMPTY_STRING="";


    private boolean valid_number_of_fields=true;

    /**
     * Names of the header fields. Every valid small file should have a header line with exactly these
     * fields.
     */
    private static final String[] headerFields = {
            "DatabaseID",
            "DiseaseName",
            "Qualifier",
            "HPO_ID",
            "Reference",
            "Evidence",
            "Onset",
            "Frequency",
            "Sex",
            "Modifier",
            "Aspect",
            "Biocuration"
    };

    /** 1. The diseaseId. For instance, "OMIM:300200". */
    private String databaseId;
    /** 3. The disease name, e.g., Marfan syndrome . */
    private String DbObjectName;
    /** 4. true is this is a negated annotation, i.e., some phenotype is not present in some disease.*/
    private boolean NOT;
    /** 5. The phenotype term id */
    private TermId phenotypeId;
    /** 6. Publication */
    private String publication;
    /** 7. Evidence about assertion */
    private String evidence;
    /** 8. The onset (can be null) */
    private TermId onsetId = null;
    /** 9. The frequency (can be null) */
    private String frequency;
    /** 10. Male, female */
    private String sex;
    /** 11. Modifier terms (0..n) */
    private String modifierList;
    /** 12. aspect */
    @SuppressWarnings("unused")
    private String aspect;
    /** 13. the biocurator/date, e.g., HPO:skoehler[2018-02-17] */
    private String biocuration;

    private HpoAnnotationLine(String line) throws PhenolException {
        String[] fields = line.split("\t");
        if (fields.length != headerFields.length) {
            valid_number_of_fields = false;
            throw new PhenolException("[phenol:ERROR] Annotation line with " + fields.length + "fields: \"" + line + "\"");
        }
        this.databaseId = fields[DATABASE_ID_IDX];
        this.DbObjectName = fields[DB_NAME_IDX];
        String phenoId = fields[PHENOTYPE_ID_IDX];
        this.phenotypeId = TermId.of(phenoId);
        String onset = fields[ONSET_ID_IDX];
        if (onset != null && onset.startsWith("HP:")) {
            onsetId = TermId.of(onset);
        }
        this.frequency = fields[FREQUENCY_IDX];
        this.sex = fields[SEX_IDX];
        String neg = fields[QUALIFIER_IDX];
        this.NOT =  (neg != null && neg.equalsIgnoreCase("NOT"));
        this.aspect = fields[ASPECT_IDX];
        this.modifierList = fields[MODIFIER_IDX];
        this.publication = fields[DB_REFERENCE_IDX];
        this.evidence = fields[EVIDENCE_IDX];
        this.biocuration = fields[BIOCURATION_IDX];
    }

    public static HpoAnnotationLine constructFromString(String line) throws PhenolException {
        try {
            return new HpoAnnotationLine(line);
        } catch (PhenolException e) {
            throw new PhenolException(String.format("Exception [%s] parsing line: %s",e.getMessage(),line));
        }
    }

    /**
     * @param line The header line of a V2 small file
     * @return true iff the fields of the line exactly match {@link #headerFields}.
     */
    static boolean isValidHeaderLine(String line) throws PhenolException {
        String[] fields = line.split("\t");
        if (fields.length != headerFields.length) {
            String msg = String.format("Expected %d fields in header line but got %d",headerFields.length, fields.length);
            throw new PhenolException(msg);
        }
        for (int i = 0; i < headerFields.length; i++) {
            if (!fields[i].equals(headerFields[i])) {
                String msg = String.format("Expected header field %d to be %s but got %s",i, headerFields[i], fields[i]);
                throw new PhenolException(msg);
            }
        }
        return true;
    }

    final String getDiseaseId() {
        return databaseId;
    }

    /**
     * This function creates a TermId form the Curie-type identifier for the disease, e.g., OMIM:600100.
     * @return The TermId representing this disease.
     * @throws PhenolException if the {@link #databaseId} field is invalid (not OMIM, ORPHA, or DECIPHER)
     */
    public TermId getDiseaseTermId() throws PhenolException {
        if (databaseId.startsWith("OMIM") ||
                databaseId.startsWith("ORPHA") ||
                databaseId.startsWith("DECIPHER")
        )
            return TermId.of(databaseId);
        // we should never get here
        throw new PhenolException("Invalid disease id (not OMIM/ORPHA/DECIPHER: "+databaseId);
    }

    public TermId getPhenotypeId() {
        return phenotypeId;
    }

    public String getOnsetId() {
        return onsetId != null ? onsetId.toString() : null;
    }

    public String getFrequency() {
        return frequency;
    }

    public String getSex() {
        return sex;
    }

    public String getModifierList() {
        return modifierList;
    }

    public List<String> getPublications() {
        ImmutableList.Builder<String> builder = new ImmutableList.Builder<>();
        if (publication == null || publication.isEmpty()) return builder.build();
        String[] A = publication.split(";") ;
        for (String a : A ){
            builder.add(a.trim());
        }
        return builder.build();
    }

    public String getEvidence() {
        return evidence;
    }

    public String getBiocuration() {
        return biocuration;
    }

    public String getDbObjectName() {
        return DbObjectName;
    }

    public String getAspect() { return this.aspect;}

    /** @return true if this annotation is negated. */
    public boolean isNOT() {
        return NOT;
    }

    public boolean hasValidNumberOfFields() {
        return valid_number_of_fields;
    }


    /**
     * @param lst List of semicolon separated HPO term ids from the modifier subontology
     * @return Immutable List of {@link TermId} objects
     */
    private static List<TermId> getModifiers(String lst) {
        ImmutableList.Builder<TermId> builder = new ImmutableList.Builder<>();
        if (lst == null || lst.isEmpty()) return builder.build(); //return empty list
        String[] modifierTermStrings = lst.split(";");
        for (String mt : modifierTermStrings) {
            TermId mtId = TermId.of(mt.trim());
            builder.add(mtId);
        }
        return builder.build();
    }

    /**
     * Extract the {@link HpoFrequency} object that corresponds to the frequency modifier in an
     * annotation line. Note that we are expecting there to be one of three kinds of frequency
     * information (an HPO term, n/m or x%). If we find nothing or there is some parsing error,
     * return the default frequency (obligate, 100%).
     *
     * @param freq The representation of the frequency, if any, in the {@code
     *             phenotype_annotation.tab} file
     * @return the corresponding {@link HpoFrequency} object or the default {@link HpoFrequency}
     * object (100%).
     */
     public static double getFrequency(String freq, Ontology ontology) {
        if (freq == null || freq.isEmpty()) {
            return HpoFrequency.ALWAYS_PRESENT.mean();
        }
        int i = freq.indexOf('%');
        if (i > 0) {
            return 0.01 * Double.parseDouble(freq.substring(0, i));
        }
        i = freq.indexOf('/');
        if (i > 0 && freq.length() > (i + 1)) {
            int n = Integer.parseInt(freq.substring(0, i));
            int m = Integer.parseInt(freq.substring(i + 1));
            return (double) n / (double) m;
        }
        try {
            TermId tid = string2TermId(freq, ontology);
            if (tid != null) return HpoFrequency.fromTermId(tid).mean();
        } catch (Exception e) {
            e.printStackTrace();
        }
        // if we get here we could not parse the Frequency, return the default 100%
        return HpoFrequency.ALWAYS_PRESENT.mean();
    }

    /**
     * Go from HP:0000123 to the corresponding TermId
     *
     * @param hp String version of an HPO term id
     * @return corresponding {@link TermId} object
     */
    private static TermId string2TermId(String hp, Ontology ontology) {
        if (!hp.startsWith("HP:")) {
            return null;
        } else {
            TermId tid = TermId.of(hp);
            if (ontology.getTermMap().containsKey(tid)) {
                return ontology
                        .getTermMap()
                        .get(tid)
                        .getId(); // replace alt_id with current if if necessary
            } else {
                return null;
            }
        }
    }

    /**
     * This fucnction transforms a {@link TermId} into an {@link HpoOnset} object. If the argument is
     * null, it means that no annotation for the onset was provided in the annotation line, and
     * then this function returns null.
     * @param ons The {@link TermId} of an HPO Onset
     * @return The {@link HpoOnset} object corresponding to the {@link TermId} in the argument
     */
    public static HpoOnset getOnset(TermId ons) {
        if (ons == null) return HpoOnset.UNKNOWN;
        return HpoOnset.fromTermId(ons);
    }

    @Override
    public String toString() {
        String [] fields={this.databaseId,
                this.DbObjectName ,
                this.phenotypeId.getValue() ,
                this.onsetId==null?EMPTY_STRING:this.onsetId.getValue(),
                this.frequency ,
                this.sex ,
                this.NOT?"NOT":"" ,
                this.aspect,
                this.modifierList ,
                this.publication,
                this.evidence ,
                this.biocuration};
        return String.join("\t",fields);
    }
}