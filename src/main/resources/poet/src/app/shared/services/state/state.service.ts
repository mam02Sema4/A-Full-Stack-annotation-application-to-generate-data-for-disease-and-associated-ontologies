import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from "rxjs";
import { AnnotationSource } from "../../models/models";

@Injectable({
  providedIn: 'root'
})
export class StateService implements OnInit {
  private selectedAnnotationSourceSubject: BehaviorSubject<AnnotationSource> = new BehaviorSubject<AnnotationSource>({
    publication: null,
    disease: null
  });
  selectedOntologySubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  sourceAndOntologySelectedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  selectedAnnotationSource: Observable<AnnotationSource> = this.selectedAnnotationSourceSubject.asObservable();
  selectedOntology: Observable<string> = this.selectedOntologySubject.asObservable();
  sourceAndOntologySelected: Observable<boolean> = this.sourceAndOntologySelectedSubject.asObservable();

  constructor() {

  }

  ngOnInit(){
  }

  setSelectedOntology(ontology: string): void {
    this.selectedOntologySubject.next(ontology);
    if(this.selectedAnnotationSourceSubject.getValue().publication != null &&
      this.selectedAnnotationSourceSubject.getValue().disease != null){
      this.sourceAndOntologySelectedSubject.next(true);
    }
  }

  getSelectedOntology() {
    return this.selectedOntologySubject.getValue();
  }

  setSelectedSource(annotationSource: AnnotationSource): void {
    this.selectedAnnotationSourceSubject.next(annotationSource);
    if(this.selectedOntologySubject.getValue() != ''){
      this.sourceAndOntologySelectedSubject.next(true);
    }
  }

  getSelectedSource() {
    return this.selectedAnnotationSourceSubject.getValue();
  }
}
