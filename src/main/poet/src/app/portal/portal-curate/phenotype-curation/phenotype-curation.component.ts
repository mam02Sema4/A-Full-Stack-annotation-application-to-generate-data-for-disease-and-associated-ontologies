import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { HpoService } from "../../../shared/services/external/hpo.service";
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from "@angular/forms";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { AnchorSearchResult, HpoTerm } from "../../../shared/models/search-models";
import { AnnotationSource, PhenotypeAnnotation, Publication } from "../../../shared/models/models";
import { CurationService } from "../../../shared/services/curation/curation.service";
import { StateService } from "../../../shared/services/state/state.service";
import { MatDialog } from "@angular/material/dialog";
import { DialogSourceComponent } from "../dialog-source/dialog-source.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { Observable } from "rxjs";
import { DialogReviewComponent } from "../dialog-review/dialog-review.component";
import { UtilityService } from "../../../shared/services/utility.service";

@Component({
  selector: 'poet-phenotype-curation',
  templateUrl: './phenotype-curation.component.html',
  styleUrls: ['./phenotype-curation.component.scss']
})
export class PhenotypeCurationComponent implements OnInit {

  @Input('selectedSource') annotationSource: AnnotationSource;
  @Input('role') userRole: string;
  @Output('onAnnotationSuccess') onAnnotationSuccess: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output('handleForm') handleFormEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  @ViewChild('modifierInput') modifierInput: ElementRef<HTMLInputElement>;
  selectedAnnotation: PhenotypeAnnotation;
  updating: boolean;
  selectedHpo: HpoTerm;
  hpoOptions: HpoTerm[];
  modifierOptions: AnchorSearchResult[]
  onsetOptions: Observable<AnchorSearchResult[]>;
  frequencyOptions: AnchorSearchResult[];
  selectedPublications: Publication[] = [];
  selectedModifiers: string[] = [];
  selectedOnset: any;
  selectedQualifier: any;
  selectedFrequency: any;
  loadingHpoSuggestions: boolean = false;
  loadingModifierSuggestions: boolean = false;
  elevatedButtonText = {approve: {display: "Approve", show: true}, deny: {display: "Deny", show: true}, changes: {display: "Make changes", show: true}};
  elevatedChanges: boolean = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  savingAnnotation: boolean = false;
  formControlGroup: FormGroup = new FormGroup({
    hpoFormControl: new FormControl({value: '', disabled: false}, Validators.required),
    onsetFormControl: new FormControl({value: '', disabled: false}),
    modifierFormControl: new FormControl({value: '', disabled: false}),
    evidenceFormControl: new FormControl({value: '', disabled: false}, Validators.required),
    qualifierFormControl: new FormControl({value: '', disabled: false}),
    sexFormControl: new FormControl({value: '', disabled: false}),
    frequencyFormControl: new FormControl({value: '', disabled: false}, this.frequencyValdiation()),
    descriptionFormControl: new FormControl({value: '', disabled: false}),
  });

  constructor(public hpoService: HpoService,
              public curationService: CurationService,
              public stateService: StateService,
              public utilityService: UtilityService,
              public dialog: MatDialog,
              private _snackBar: MatSnackBar) {
  }

  ngOnInit(): void {

    /**
     * Subscribe to our state service to get the current annotation source
     * (disease + publications)
     */
    this.stateService.selectedAnnotationSource.subscribe(source => {
      if (source?.publication) {
        this.selectedPublications = [source.publication];
      }
    });

    /**
     * Subscribe to our state service to get the selected phenotype annotation.
     */
    this.stateService.selectedPhenotypeAnnotation.subscribe((annotation) => {
      if (!annotation) {
        this.selectedPublications = [];
        this.resetPhenotypeForm();
      } else {
        this.selectedAnnotation = annotation;
        this.setFormValues(annotation);
      }
    });

    /**
     * Subscribe to our state service to figure out the state of the form.
     */
    this.stateService.selectedAnnotationMode.subscribe((mode) => {
      if (mode == 'view') {
        this.formControlGroup.disable();
      } else if (mode == 'edit') {
        this.updating = true;
        this.onsetOptions = this.hpoService.searchDescendants("", 'HP:0003674')
        this.formControlGroup.enable();
      } else {
        this.onsetOptions = this.hpoService.searchDescendants("", 'HP:0003674')
        this.formControlGroup.enable();
      }
    });

    this.formControlGroup.get("hpoFormControl").valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(query => {
        if (query && query.length >= 3 && !this.formControlGroup.disabled) {
          this.loadingHpoSuggestions = true;
          this.hpoService.searchHPOTerms(query).subscribe((data) => {
            if (!data || data.length == 0) {
              this.formControlGroup.get("hpoFormControl").setErrors({notFound: true});
            }
            this.hpoOptions = data;
          }, (err) => {
            this.formControlGroup.get("hpoFormControl").setErrors({apiError: true});
          }, () => {
            this.loadingHpoSuggestions = false;
          });
        }
      });

    this.formControlGroup.get("modifierFormControl").valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(query => {
        if (query && query.length >= 3 && !this.formControlGroup.disabled) {
          this.loadingModifierSuggestions = true;
          this.modifierOptions = [];
          this.hpoService.searchDescendants(query, 'HP:0012823').subscribe((data) => {
            if (!data || data.length == 0) {
              this.formControlGroup.get("modifierFormControl").setErrors({notFound: true});
            }
            this.modifierOptions = data;
          }, (err) => {
            this.formControlGroup.get("modifierFormControl").setErrors({apiError: true});
          }, () => {
            this.loadingModifierSuggestions = false;
          });
        }
      });

    this.formControlGroup.get("frequencyFormControl").valueChanges.pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(query => {
        if (query && query.length >= 3 && !this.formControlGroup.disabled && isNaN(query)) {
          this.hpoService.searchDescendants(query, 'HP:0040279').subscribe((data) => {
            if ((!data || data.length == 0) && (query.startsWith("HP:") || query.match(/^[A-Za-z]{3}/))) {
              this.formControlGroup.get("frequencyFormControl").setErrors({notFound: true});
            }
            this.frequencyOptions = data;
          }, (err) => {
            this.formControlGroup.get("frequencyFormControl").setErrors({apiError: true});
          });
        }
      });
    this.formControlGroup.get('evidenceFormControl').setValue('TAS');
  }

  getFormPhenotypeAnnotation(){
    return {
      id: this.selectedAnnotation && this.selectedAnnotation.id ? this.selectedAnnotation.id : null,
      hpoId: this.formControlGroup.get('hpoFormControl').value.id,
      hpoName: this.formControlGroup.get('hpoFormControl').value.name,
      evidence: this.formControlGroup.get('evidenceFormControl').value,
      description: this.formControlGroup.get('descriptionFormControl').value,
      sex: this.formControlGroup.get('sexFormControl').value,
      qualifier: this.selectedQualifier == true ? "NOT" : '',
      frequency: this.getFrequencyValue(),
      modifiers: this.selectedModifiers.join(";"),
      onset: this.formControlGroup.get('onsetFormControl').value?.ontologyId,
      message: ""
    };
  }

  /**
   * Gets the frequency value from the form group. It can take on a few values,
   * either an hpo id, a fraction, or a percentage.
   */
  getFrequencyValue(): any {
    const freqOntology = this.formControlGroup.get('frequencyFormControl').value?.ontologyId
    if (freqOntology) {
      return freqOntology
    }
    return this.formControlGroup.get('frequencyFormControl').value;
  }

  /**
   * Submit the form to our service.
   */
  submitForm(): void {
    const phenotypeAnnotation = this.getFormPhenotypeAnnotation();
    this.savingAnnotation = true;
    if (this.updating) {
      this.curationService.updateAnnotation(phenotypeAnnotation, 'phenotype', '').subscribe(() => {
        this.onSuccessfulPhenotype('Annotation Updated!', false);
      }, (err) => {
        this.onErrorPhenotype();
      });
    } else {
      this.curationService.saveAnnotation(phenotypeAnnotation, 'phenotype').subscribe(() => {
        this.onSuccessfulPhenotype('Annotation Saved!', false);
      }, (err) => {
        this.onErrorPhenotype();
      });
    }
  }

  /**
   * Helper function to set form values when viewing a specific annotation.
   * @param annotation the selected phenotype annotation
   */
  setFormValues(annotation: PhenotypeAnnotation) {
    this.formControlGroup.get('hpoFormControl').setValue({id: annotation.hpoId, name: annotation.hpoName});
    this.formControlGroup.get('evidenceFormControl').setValue(annotation.evidence);
    this.formControlGroup.get('descriptionFormControl').setValue(annotation.description);
    this.formControlGroup.get('frequencyFormControl').setValue(annotation.frequency);
    this.selectedFrequency = annotation.frequency;
    this.formControlGroup.get('onsetFormControl').setValue({ontologyId: annotation.onset, name: ""});
    this.selectedModifiers = annotation.modifier.length > 0 ?  annotation.modifier.split(";") : []
    this.formControlGroup.get('sexFormControl').setValue(annotation.sex);
    this.selectedQualifier = annotation.qualifier == "NOT";
    this.stateService.setSelectedSource(annotation.annotationSource);
    this.formControlGroup.markAsPristine();
  }

  /**
   * Anytime we make successful changes to a phenotype we want to trigger
   * a reload of counts and the annotations themselves
   * @param message - the message to display in the snackbar
   * @param close - whether to close the form or not for this post op.
   */
  onSuccessfulPhenotype(message: string, close: boolean) {
    this.savingAnnotation = false;
    this.stateService.triggerAnnotationReload(true);
    this.stateService.triggerAnnotationCountsReload(true);
    if(close) {
      this.closeForm();
    } else {
      this.resetPhenotypeForm();
    }
    this._snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: "left"
    });
  }

  /**
   * Anytime we have an error when processing the phenotype changes we want to show a message
   * TODO: make this more verbose with the returned error.
   */
  onErrorPhenotype() {
    this.savingAnnotation = false;
    this._snackBar.open('Error Saving Annotation!', 'Close', {
      duration: 3000,
      horizontalPosition: "left"
    });
  }

  /**
   * Allowing a curator to select the active publication from our publication
   * dialog for their annotation.
   */
  selectPublication() {
    this.dialog.open(DialogSourceComponent, {
      minWidth: 300,
      data: {
        "userRole": this.userRole
      }
    });
  }

  /**
   * Is our form group fully valid? Used to show action buttons.
   */
  everythingValid() {
    return this.formControlGroup.valid && this.selectedPublications.length > 0 && !this.formControlGroup.disabled && this.formControlGroup.dirty
  }

  resetPhenotypeForm() {
    this.formControlGroup.reset();
    this.formControlGroup.get('evidenceFormControl').setValue('TAS');
    this.selectedQualifier = false;
    this.selectedModifiers = [];
    this.selectedOnset = [];
  }

  removePublication(publication: Publication): void {
    const index = this.selectedPublications.indexOf(publication);
    if (index >= 0) {
      this.selectedPublications.splice(index, 1);
    }
  }

  /**
   * Validates either
   * N / M
   * NNN%
   * or an hpo term
   */
  frequencyValdiation(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if(control.value && typeof control.value !== 'object'){
        if(control.value.includes("/") && new RegExp("\\d+\\/\\d+").test(control.value)){
          const nums = control.value.split("/");
          return parseFloat(nums[0].trim()) > parseFloat(nums[1].trim()) ? { notValid: {value: "M Greater than M"}} : null;
        } else if(new RegExp("\d{0,3}%").test(control.value)) {
          let number = parseInt(control.value.split("%")[0]);
          if(number <= 100){
            return null;
          } else {
            return {notValid: {value: "Percentage greater than 100%"}};
          }
        } else {
          return {notValid: {value: "Not a valid frequency"}};
        }
      } else if(!this.selectedFrequency) {
        return null;
      }
    }
  }

  removeModifiers(modifier: string): void {
    const index = this.selectedModifiers.indexOf(modifier);
    if (index >= 0) {
      this.selectedModifiers.splice(index, 1);
    }
  }

  selectedModifier(event: MatAutocompleteSelectedEvent): void {
    this.selectedModifiers.push(event.option.value);
    this.modifierInput.nativeElement.value = '';
    this.formControlGroup.get("modifierFormControl").setValue(null);
  }

  closeForm() {
    this.stateService.setSelectedPhenotypeAnnotation(null);
    this.elevatedButtonText = {approve: {display: "Approve", show: true}, deny: {display: "Deny", show: true}, changes: {display: "Make changes", show: true}};
    this.elevatedChanges = false;
    this.handleFormEmitter.emit(false);
  }

  /**
   * A function to handle an elevated curators review of an annotation.
   * @param action - either approve or deny
   */
  reviewAnnotation(action: string){
    if(action === 'approve'){
      const phenotypeAnnotation = this.getFormPhenotypeAnnotation();
      if(this.elevatedChanges){
        this.curationService.updateAnnotation(phenotypeAnnotation, 'phenotype', "").subscribe(() => {
          this.onSuccessfulPhenotype('Phenotype Annotation Approved!', true);
        }, (err) => {
          this.onErrorPhenotype();
        });
      } else {
        this.curationService.updateAnnotation(phenotypeAnnotation, 'phenotype', "approve").subscribe(() => {
          this.onSuccessfulPhenotype('Phenotype Annotation Approved!', true);
        }, (err) => {
          this.onErrorPhenotype();
        });
      }
    } else if(action === 'deny') {
      this.dialog.open(DialogReviewComponent, {
        minWidth: 300,
        minHeight: 250,
        data: {
          title: "Deny Phenotype Annotation.",
          approve: false
        }
      }).afterClosed().subscribe((data) => {
        if(data.confirmed){
          const phenotypeAnnotation = this.getFormPhenotypeAnnotation();
          phenotypeAnnotation.message = data.message;
          this.curationService.updateAnnotation(phenotypeAnnotation, 'phenotype', "deny").subscribe(() => {
            this.onSuccessfulPhenotype('Phenotype Annotation Rejected!', true);
          }, (err) => {
            this.onErrorPhenotype();
          });
        }
      });
    }
  }

  /**
   * Elevated curator making changes to an annotation under_review
   */
  makeAnnotationChanges(){
    this.elevatedChanges = true;
    this.formControlGroup.enable();
    this.elevatedButtonText.approve.display = "Save & Accept";
    this.elevatedButtonText.changes.show = false;
  }
}
